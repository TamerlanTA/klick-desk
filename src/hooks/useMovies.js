import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMovies, selectMovies } from "../features/movies/moviesSlice.js";
import { getTmdbKey } from "../services/movieApi.js";
export function useMovies() {
  const dispatch = useDispatch();
  const state = useSelector(selectMovies);
  const hasKey = Boolean(getTmdbKey());
  useEffect(() => {
    const request = dispatch(fetchMovies());
    return () => request.abort();
  }, [dispatch, hasKey]);
  return {
    ...state,
    status: !hasKey ? "missing-key" : state.status,
    refresh: () => {
      dispatch(fetchMovies({ force: true }));
    },
  };
}
