import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { taskService } from "../../services/taskService.js";
import { getDashboardStats } from "../../utils/stats.js";

const emptyRequest = () => ({ status: "idle", error: "", requestId: null });
const emptyList = () => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 6,
  totalPages: 1,
  summary: { total: 0, completed: 0 },
});
export const fetchTasks = createAsyncThunk("tasks/list", (params, { signal }) =>
  taskService.list({ ...params, signal }),
);
export const fetchTaskDetails = createAsyncThunk(
  "tasks/details",
  (id, { signal }) => taskService.get(id, { signal }),
);
export const fetchAllTasks = createAsyncThunk("tasks/all", (_, { signal }) =>
  taskService.listAll({ signal }),
);
export const mutateTask = createAsyncThunk(
  "tasks/mutate",
  async ({ operation, id, values }) => {
    if (operation === "create")
      return { operation, task: await taskService.create(values) };
    if (operation === "update")
      return { operation, task: await taskService.update(id, values) };
    if (operation === "remove")
      return { operation, task: await taskService.remove(id) };
    throw new Error("Неизвестная операция с задачей.");
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState: {
    entities: {},
    list: { ...emptyRequest(), ...emptyList() },
    details: { ...emptyRequest(), id: null, notFound: false },
    all: { ...emptyRequest(), ids: [] },
    mutation: emptyRequest(),
    revision: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    for (const [thunk, key] of [
      [fetchTasks, "list"],
      [fetchTaskDetails, "details"],
      [fetchAllTasks, "all"],
    ]) {
      builder.addCase(thunk.pending, (state, action) => {
        Object.assign(state[key], {
          status: "loading",
          error: "",
          requestId: action.meta.requestId,
        });
        if (key === "details")
          Object.assign(state.details, {
            id: action.meta.arg,
            notFound: false,
          });
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (state[key].requestId !== action.meta.requestId) return;
        const data = action.payload;
        const items =
          key === "list" ? data.items : key === "all" ? data : [data];
        for (const item of items)
          state.entities[item.id] = { ...state.entities[item.id], ...item };
        if (key === "list")
          Object.assign(state.list, {
            ...data,
            items: data.items.map((item) => item.id),
          });
        if (key === "all") state.all.ids = data.map((item) => item.id);
        state[key].status = "success";
      });
      builder.addCase(thunk.rejected, (state, action) => {
        if (state[key].requestId !== action.meta.requestId) return;
        state[key].status = action.meta.aborted ? "idle" : "error";
        state[key].error = action.meta.aborted ? "" : action.error.message;
        if (key === "details")
          state.details.notFound = action.error.name === "NotFoundError";
      });
    }
    builder.addCase(mutateTask.pending, (state, action) => {
      Object.assign(state.mutation, {
        status: "loading",
        error: "",
        requestId: action.meta.requestId,
      });
    });
    builder.addCase(mutateTask.fulfilled, (state, { payload }) => {
      if (payload.operation === "remove")
        delete state.entities[payload.task.id];
      else state.entities[payload.task.id] = payload.task;
      state.mutation.status = "success";
      // Invalidate in-flight reads as well as the service cache. Mounted views refetch.
      for (const key of ["list", "details", "all"]) state[key].requestId = null;
      state.revision += 1;
    });
    builder.addCase(mutateTask.rejected, (state, action) => {
      state.mutation.status = "error";
      state.mutation.error = action.error.message;
    });
  },
});
export default tasksSlice.reducer;
export const selectTaskEntities = (state) => state.tasks.entities;
export const selectTaskRevision = (state) => state.tasks.revision;
export const selectTaskList = createSelector(
  [selectTaskEntities, (state) => state.tasks.list],
  (entities, list) => ({
    ...list,
    items: list.items.map((id) => entities[id]).filter(Boolean),
  }),
);
export const selectAllTasks = createSelector(
  [selectTaskEntities, (state) => state.tasks.all.ids],
  (entities, ids) => ids.map((id) => entities[id]).filter(Boolean),
);
export const selectDashboardStats = createSelector(
  [selectAllTasks, (_, category) => category],
  getDashboardStats,
);
export const selectCurrentTask = (state) =>
  state.tasks.details.status === "success"
    ? state.tasks.entities[state.tasks.details.id]
    : null;
