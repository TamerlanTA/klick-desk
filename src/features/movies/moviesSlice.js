import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchPopularMovies,
  getTmdbKey,
  isCacheFresh,
  readMoviesCache,
  saveMoviesCache,
} from "../../services/movieApi.js";

export const fetchMovies = createAsyncThunk(
  "movies/fetch",
  async ({ force = false } = {}, { signal }) => {
    if (!getTmdbKey())
      return {
        status: "missing-key",
        movies: [],
        source: null,
        savedAt: null,
        error: "",
      };
    const cached = readMoviesCache();
    const fromCache = (error = "") => ({
      status: "success",
      movies: cached.movies,
      source: "cache",
      savedAt: cached.timestamp,
      error,
    });
    if (cached && (!navigator.onLine || (!force && isCacheFresh(cached))))
      return fromCache();
    try {
      let source = "api";
      const movies = await fetchPopularMovies({
        signal,
        onSource: (value) => {
          source = value;
        },
      });
      const saved = saveMoviesCache(movies);
      return {
        status: "success",
        movies,
        source,
        savedAt: saved.timestamp,
        error: "",
      };
    } catch (error) {
      if (signal.aborted) throw error;
      if (cached) return fromCache(error.message);
      throw error;
    }
  },
);
const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    status: "idle",
    movies: [],
    source: null,
    savedAt: null,
    error: "",
    requestId: null,
  },
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchMovies.pending, (state, action) => {
        state.status = "loading";
        state.error = "";
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        if (state.requestId === action.meta.requestId)
          Object.assign(state, action.payload);
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = action.meta.aborted ? "idle" : "error";
        state.error = action.meta.aborted ? "" : action.error.message;
      }),
});
export default moviesSlice.reducer;
export const selectMovies = (state) => state.movies;
