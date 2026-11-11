import { useEffect, useState } from "react";
import {
  fetchPopularMovies,
  getTmdbKey,
  isCacheFresh,
  readMoviesCache,
  saveMoviesCache,
} from "../services/movieApi.js";

// Загружает популярные фильмы: свежий кэш (< 1 часа) → из кэша, иначе → из API.
// refresh() принудительно идёт в API, не глядя на кэш.
export function useMovies() {
  const hasKey = Boolean(getTmdbKey());
  const [state, setState] = useState({
    status: hasKey ? "loading" : "missing-key",
    movies: [],
    source: null, // "api" или "cache"
    savedAt: null,
    error: "",
  });
  // force: true — игнорировать кэш. id меняется при каждом Refresh, чтобы effect запустился снова.
  const [request, setRequest] = useState({ id: 0, force: false });

  useEffect(() => {
    if (!hasKey) return;
    const cached = readMoviesCache();
    if (!request.force && isCacheFresh(cached)) {
      setState({ status: "success", movies: cached.movies, source: "cache", savedAt: cached.timestamp, error: "" });
      return;
    }

    const controller = new AbortController();
    let active = true;
    setState((current) => ({ ...current, status: "loading", error: "" }));
    fetchPopularMovies({ signal: controller.signal })
      .then((movies) => {
        if (!active) return;
        const entry = saveMoviesCache(movies);
        setState({ status: "success", movies, source: "api", savedAt: entry.timestamp, error: "" });
      })
      .catch((failure) => {
        if (!active || failure.name === "AbortError") return;
        // API недоступен, но старый кэш есть — показываем его и честно пишем об ошибке.
        if (cached) {
          setState({ status: "success", movies: cached.movies, source: "cache", savedAt: cached.timestamp, error: failure.message });
        } else {
          setState({ status: "error", movies: [], source: null, savedAt: null, error: failure.message });
        }
      });
    // Устаревший запрос (например, после двойного Refresh) не перезапишет новый результат.
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasKey, request]);

  function refresh() {
    setRequest((current) => ({ id: current.id + 1, force: true }));
  }

  return { ...state, refresh };
}
