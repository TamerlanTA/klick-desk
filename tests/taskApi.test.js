import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { taskApi, TASKS_KEY } from "../src/services/taskApi.js";
import initialTasks from "../src/data/tasks.json";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(() => vi.restoreAllMocks());

describe("simulated task API", () => {
  it("initializes 100 unique records and returns distinct pages", async () => {
    expect(initialTasks).toHaveLength(100);
    expect(new Set(initialTasks.map((task) => task.id)).size).toBe(100);
    const first = await taskApi.list();
    const second = await taskApi.list({ page: 2 });
    expect(first.total).toBe(100);
    expect(first.totalPages).toBe(17);
    expect(first.items).toHaveLength(6);
    expect(
      second.items.every(
        (task) => !first.items.some((item) => item.id === task.id),
      ),
    ).toBe(true);
    expect(JSON.parse(localStorage.getItem(TASKS_KEY)).tasks).toHaveLength(100);
  });

  it("combines search/category/status and sorts before pagination", async () => {
    const result = await taskApi.list({
      search: "проверить",
      category: "Учёба",
      status: "active",
      sort: "dueDate",
    });
    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every(
        (task) =>
          task.category === "Учёба" &&
          !task.completed &&
          `${task.title} ${initialTasks.find((item) => item.id === task.id).description}`
            .toLowerCase()
            .includes("проверить"),
      ),
    ).toBe(true);
    expect(
      result.items.every(
        (task, index) =>
          index === 0 || result.items[index - 1].dueDate <= task.dueDate,
      ),
    ).toBe(true);
    expect(result.summary.total).toBe(100);
    const high = await taskApi.list({ sort: "priority" });
    expect(high.items.every((task) => task.priority === "Высокий")).toBe(true);
    const named = await taskApi.list({ sort: "title" });
    expect(
      named.items.every(
        (task, index) =>
          index === 0 ||
          named.items[index - 1].title.localeCompare(task.title, "ru") <= 0,
      ),
    ).toBe(true);
  });

  it("clamps an out-of-range page and handles no results", async () => {
    const last = await taskApi.list({ page: 1000 });
    expect(last.page).toBe(17);
    expect(last.items).toHaveLength(4);
    const empty = await taskApi.list({
      page: 10,
      search: "несуществующая задача 9876",
    });
    expect(empty.total).toBe(0);
    expect(empty.page).toBe(1);
    expect(empty.items).toEqual([]);
    expect((await taskApi.list({ pageSize: 12 })).totalPages).toBe(9);
  });

  it("persists create/update/detail/delete without mutating other records", async () => {
    const created = await taskApi.create({
      title: "Новая тестовая задача",
      description: "Подробности",
      category: "Учёба",
      priority: "Высокий",
      dueDate: "2026-10-22",
    });
    expect((await taskApi.list()).items[0].id).toBe(created.id);
    expect((await taskApi.get(created.id)).description).toBe("Подробности");
    await taskApi.update(created.id, {
      completed: true,
      title: "Изменённая задача",
    });
    expect((await taskApi.get(created.id)).completed).toBe(true);
    await taskApi.remove(created.id);
    expect((await taskApi.list()).total).toBe(100);
    await expect(taskApi.get(created.id)).rejects.toThrow("не найдена");
  });

  it("rejects invalid writes and keeps storage intact", async () => {
    await taskApi.list();
    const previous = localStorage.getItem(TASKS_KEY);
    await expect(
      taskApi.create({
        title: " ",
        category: "Учёба",
        priority: "Высокий",
        dueDate: "2026-02-30",
      }),
    ).rejects.toThrow();
    expect(localStorage.getItem(TASKS_KEY)).toBe(previous);
  });

  it("cancels requests before reading or writing storage", async () => {
    const controller = new AbortController();
    const pending = taskApi.list({ signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(localStorage.getItem(TASKS_KEY)).toBe(null);
  });

  it("preserves legacy tasks and keeps the legacy backup", async () => {
    const old = [
      { ...initialTasks[0], id: "my-task", title: "Моя сохранённая задача" },
    ];
    const raw = JSON.stringify({ version: 1, tasks: old });
    localStorage.setItem("jarvis-desk.tasks.v1", raw);
    const result = await taskApi.list();
    expect(result.total).toBe(101);
    expect((await taskApi.get("my-task")).title).toBe("Моя сохранённая задача");
    expect(localStorage.getItem("jarvis-desk.tasks.v1")).toBe(raw);
  });

  it("does not repopulate an intentionally empty list", async () => {
    localStorage.setItem(TASKS_KEY, JSON.stringify({ version: 2, tasks: [] }));
    expect((await taskApi.list()).total).toBe(0);
    localStorage.removeItem(TASKS_KEY);
    localStorage.setItem(
      "jarvis-desk.tasks.v1",
      JSON.stringify({ version: 1, tasks: [] }),
    );
    expect((await taskApi.list()).total).toBe(0);
  });

  it("reports damaged data without overwriting it", async () => {
    localStorage.setItem(TASKS_KEY, "{broken");
    await expect(taskApi.list()).rejects.toThrow("не перезаписаны");
    expect(localStorage.getItem(TASKS_KEY)).toBe("{broken");
  });

  it("reports a failed save without claiming success", async () => {
    await taskApi.list();
    const previous = localStorage.getItem(TASKS_KEY);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota", "QuotaExceededError");
    });
    await expect(
      taskApi.update("seed-001", { completed: true }),
    ).rejects.toThrow("сохранить");
    expect(localStorage.getItem(TASKS_KEY)).toBe(previous);
  });
});


it("returns lightweight list records and loads additional meaningful details", async () => {
  const result = await taskApi.list();
  expect(result.items[0].createdAt).toBeUndefined();
  const details = await taskApi.get(result.items[0].id);
  expect(details.description.length).toBeGreaterThan(0);
  expect(Number.isFinite(Date.parse(details.createdAt))).toBe(true);
});

it("simulates random errors without committing writes and permits retry", async () => {
  await taskApi.list();
  const previous = localStorage.getItem(TASKS_KEY);
  vi.spyOn(Math, "random").mockReturnValue(0.01);
  await expect(taskApi.update("seed-001", { completed: true })).rejects.toThrow("Временная ошибка API");
  expect(localStorage.getItem(TASKS_KEY)).toBe(previous);
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  expect((await taskApi.update("seed-001", { completed: true })).completed).toBe(true);
});
