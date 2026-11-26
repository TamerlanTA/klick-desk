import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createAppStore } from "../src/store/store.js";
import {
  fetchTasks,
  fetchTaskDetails,
  fetchAllTasks,
  mutateTask,
  selectTaskList,
  selectDashboardStats,
} from "../src/features/tasks/tasksSlice.js";
import { taskApi } from "../src/services/taskApi.js";
import initialTasks from "../src/data/tasks.json";
import { connectivityChanged } from "../src/features/pwa/pwaSlice.js";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(() => vi.restoreAllMocks());
it("ignores stale list responses even when a service ignores cancellation", async () => {
  vi.restoreAllMocks(); // Real random IDs: the API itself is mocked in this race test.
  const pending = [];
  vi.spyOn(taskApi, "list").mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  const store = createAppStore();
  const old = store.dispatch(fetchTasks({ search: "old" }));
  const current = store.dispatch(fetchTasks({ search: "new" }));
  const result = (task) => ({
    items: [task],
    summary: { total: 1, completed: 0 },
    total: 1,
    totalPages: 1,
    page: 1,
    pageSize: 6,
  });
  pending[1](result({ ...initialTasks[0], title: "Newest" }));
  await current;
  pending[0](result({ ...initialTasks[0], title: "Stale" }));
  await old;
  expect(selectTaskList(store.getState()).items[0].title).toBe("Newest");
});
it("normalizes list/details/all, invalidates after mutation and memoizes selectors", async () => {
  const store = createAppStore();
  await store.dispatch(fetchTasks({ page: 1 })).unwrap();
  const first = selectTaskList(store.getState()).items[0];
  expect(first.createdAt).toBeUndefined();
  await store.dispatch(fetchTaskDetails(first.id)).unwrap();
  expect(store.getState().tasks.entities[first.id].createdAt).toBeTruthy();
  await store.dispatch(fetchAllTasks()).unwrap();
  const stats = selectDashboardStats(store.getState(), "Все");
  const list = selectTaskList(store.getState());
  store.dispatch(connectivityChanged(false));
  expect(selectTaskList(store.getState())).toBe(list);
  expect(selectDashboardStats(store.getState(), "Все")).toBe(stats);
  await store
    .dispatch(
      mutateTask({
        operation: "update",
        id: first.id,
        values: { title: "Redux saved" },
      }),
    )
    .unwrap();
  expect(store.getState().tasks.revision).toBe(1);
  expect(store.getState().tasks.all.requestId).toBe(null);
  await store.dispatch(fetchTaskDetails(first.id)).unwrap();
  expect(store.getState().tasks.entities[first.id].title).toBe("Redux saved");
});
it("handles a rejected request, a retry and a missing detail ID", async () => {
  const store = createAppStore();
  taskApi.failNextRequest();
  await store.dispatch(fetchTasks({ page: 1 }));
  expect(store.getState().tasks.list.status).toBe("error");
  await store.dispatch(fetchTasks({ page: 1 }));
  expect(store.getState().tasks.list.status).toBe("success");
  await store.dispatch(fetchTaskDetails("not-found"));
  expect(store.getState().tasks.details.notFound).toBe(true);
});
