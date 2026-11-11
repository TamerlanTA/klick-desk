import MovieCard from "../components/MovieCard.jsx";
import { useMovies } from "../hooks/useMovies.js";

const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty",
});

export default function MoviesPage() {
  const { status, movies, source, savedAt, error, refresh } = useMovies();

  return (
    <section className="page movies-page" aria-labelledby="movies-heading">
      <div className="panel-heading">
        <h1 id="movies-heading">Популярные фильмы</h1>
        {status !== "missing-key" && (
          <button type="button" className="secondary-button" disabled={status === "loading"} onClick={refresh}>
            Refresh
          </button>
        )}
      </div>

      {source && status !== "loading" && (
        // Баннер всегда говорит, откуда сейчас данные.
        <p className={`cache-banner is-${source}`} role="status">
          {source === "api" ? "Загружено из API" : "Показано из кэша"} · сохранено{" "}
          {timeFormat.format(savedAt)}. Кэш живёт 1 час.
        </p>
      )}
      {status === "success" && error && <p className="field-error" role="alert">{error}</p>}

      {status === "missing-key" ? (
        <div className="login-note">
          <p><strong>Нет ключа TMDB.</strong> Фильмы загружаются из The Movie Database.</p>
          <p>
            Получи API Key (v3) на themoviedb.org → Settings → API, добавь строку{" "}
            <code>VITE_TMDB_API_KEY=…</code> в файл <code>.env.local</code> и перезапусти{" "}
            <code>npm run dev</code> (для сайта — <code>npm run deploy</code>).
          </p>
        </div>
      ) : status === "loading" ? (
        <p className="list-loading" role="status">Загружаем фильмы…</p>
      ) : status === "error" ? (
        <div className="list-error">
          <p role="alert">{error}</p>
          <button type="button" className="secondary-button" onClick={refresh}>Повторить</button>
        </div>
      ) : movies.length === 0 ? (
        <p className="empty-state">TMDB вернул пустой список.</p>
      ) : (
        <ul className="movie-grid" aria-label="Фильмы">
          {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
        </ul>
      )}
      <p className="muted-text">Данные: The Movie Database (TMDB).</p>
    </section>
  );
}
