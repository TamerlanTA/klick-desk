import { configureStore } from "@reduxjs/toolkit";
import tasks from "../features/tasks/tasksSlice.js";
import movies from "../features/movies/moviesSlice.js";
import pwa from "../features/pwa/pwaSlice.js";
export const createAppStore = () =>
  configureStore({ reducer: { tasks, movies, pwa } });
export const store = createAppStore();
