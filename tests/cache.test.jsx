import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { taskApi } from "../src/services/taskApi.js";
import { taskService } from "../src/services/taskService.js";
import { MOVIES_CACHE_KEY, MOVIES_TTL_MS } from "../src/services/movieApi.js";
import { useMovies } from "../src/hooks/useMovies.js";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("task query cache", () => {
  it("serves repeated reads from cache and refetches after a mutation", async () => {
    const list = vi.spyOn(taskApi, "list");
    const first = await taskService.list({ page: 1, pageSize: 6 });
    await taskService.list({ page: 1, pageSize: 6 });
    expect(list).toHaveBeenCalledTimes(1);
    // Другие параметры — другой ключ — отдельный запрос.
    await taskService.list({ page: 2, pageSize: 6 });
    expect(list).toHaveBeenCalledTimes(2);

    await taskService.update(first.items[0].id, { title: "Изменено после кэша" });
    const after = await taskService.list({ page: 1, pageSize: 6 });
    expect(list).toHaveBeenCalledTimes(3);
    expect(after.items.some((task) => task.title === "Изменено после кэша")).toBe(true);
  });

  it("invalidates details and stats after delete, and expires by TTL", async () => {
    const get = vi.spyOn(taskApi, "get");
    const all = await taskService.listAll();
    const id = all[0].id;
    await taskService.get(id);
    await taskService.remove(id);
    await expect(taskService.get(id)).rejects.toThrow("Задача не найдена.");
    expect(get).toHaveBeenCalledTimes(2);
    expect((await taskService.listAll()).length).toBe(all.length - 1);

    const now = Date.now();
    await taskService.get(all[1].id);
    vi.spyOn(Date, "now").mockReturnValue(now + 61 * 1000);
    await taskService.get(all[1].id);
    expect(get).toHaveBeenCalledTimes(4);
  });

  it("does not cache failed requests", async () => {
    const list = vi.spyOn(taskApi, "list");
    taskService.failNextRequest();
    await expect(taskService.list({ page: 1 })).rejects.toThrow("Временная ошибка API");
    await expect(taskService.list({ page: 1 })).resolves.toBeTruthy();
    expect(list).toHaveBeenCalledTimes(2);
  });
});

const tmdbResponse = {
  ok: true,
  status: 200,
  json: async () => ({
    results: [{ id: 1, title: "Фильм из API", vote_average: 7.84, release_date: "2026-03-01", poster_path: "/p.jpg" }],
  }),
};
const cachedMovie = { id: 9, title: "Фильм из кэша", rating: 6, year: "2025", poster: null };
const saveCache = (timestamp) =>
  localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify({ timestamp, movies: [cachedMovie] }));

describe("useMovies", () => {
  beforeEach(() => vi.stubEnv("VITE_TMDB_API_KEY", "test-key"));

  it("shows a fresh cache without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    saveCache(Date.now() - 10 * 60 * 1000);
    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.source).toBe("cache");
    expect(result.current.movies[0].title).toBe("Фильм из кэша");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the API when the cache is older than the TTL and rewrites it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(tmdbResponse);
    vi.stubGlobal("fetch", fetchMock);
    saveCache(Date.now() - MOVIES_TTL_MS - 1000);
    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.source).toBe("api"));
    expect(result.current.movies[0]).toMatchObject({ title: "Фильм из API", year: "2026" });
    expect(fetchMock.mock.calls[0][0]).toContain("language=ru-RU");
    const saved = JSON.parse(localStorage.getItem(MOVIES_CACHE_KEY));
    expect(saved.movies[0].title).toBe("Фильм из API");
    expect(Date.now() - saved.timestamp).toBeLessThan(5000);
  });

  it("Refresh ignores a fresh cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(tmdbResponse);
    vi.stubGlobal("fetch", fetchMock);
    saveCache(Date.now());
    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.source).toBe("cache"));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.source).toBe("api"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps showing the old cache when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    saveCache(Date.now() - MOVIES_TTL_MS - 1);
    const { result } = renderHook(() => useMovies());
    await waitFor(() => expect(result.current.error).toContain("503"));
    expect(result.current.source).toBe("cache");
    expect(result.current.movies).toHaveLength(1);
  });

  it("explains a missing TMDB key instead of showing fake data", () => {
    vi.stubEnv("VITE_TMDB_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useMovies());
    expect(result.current.status).toBe("missing-key");
    expect(result.current.movies).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
