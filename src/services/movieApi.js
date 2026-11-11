// Популярные фильмы TMDB + кэш в localStorage. UI сюда напрямую не ходит — только через useMovies.
export const MOVIES_TTL_MS = 60 * 60 * 1000; // 1 час
export const MOVIES_CACHE_KEY = "klick-desk.movies.v1";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";

// Ключ читаем при каждом вызове, а не один раз при импорте (так его проще подменить в тестах).
export function getTmdbKey() {
  return import.meta.env.VITE_TMDB_API_KEY ?? "";
}

// Кэш: { timestamp, movies }. Повреждённые данные считаем отсутствующими.
export function readMoviesCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(MOVIES_CACHE_KEY));
    if (typeof saved?.timestamp === "number" && Array.isArray(saved.movies)) return saved;
  } catch {
    // Испорченный JSON — просто нет кэша.
  }
  return null;
}

export function saveMoviesCache(movies) {
  const entry = { timestamp: Date.now(), movies };
  try {
    localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Хранилище переполнено или запрещено — фильмы всё равно покажем.
  }
  return entry;
}

// Свежий = сохранён меньше часа назад.
export function isCacheFresh(entry, now = Date.now()) {
  return entry !== null && now - entry.timestamp < MOVIES_TTL_MS;
}

export async function fetchPopularMovies({ signal } = {}) {
  const params = new URLSearchParams({ api_key: getTmdbKey(), language: "ru-RU", page: "1" });
  const response = await fetch(`https://api.themoviedb.org/3/movie/popular?${params}`, { signal });
  if (response.status === 401) throw new Error("TMDB не принял ключ. Проверь VITE_TMDB_API_KEY.");
  if (!response.ok) throw new Error(`TMDB ответил ошибкой ${response.status}. Повтори запрос.`);
  const data = await response.json();
  if (!Array.isArray(data?.results)) throw new Error("TMDB вернул неожиданный ответ.");
  // Оставляем только поля, которые показывает карточка.
  return data.results.map((movie) => ({
    id: movie.id,
    title: movie.title,
    rating: movie.vote_average,
    year: movie.release_date?.slice(0, 4) || "—",
    poster: movie.poster_path ? POSTER_URL + movie.poster_path : null,
  }));
}
