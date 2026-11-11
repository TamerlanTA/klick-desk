export default function MovieCard({ movie }) {
  return (
    <li className="movie-card">
      {movie.poster ? (
        <img src={movie.poster} alt={`Постер: ${movie.title}`} width="342" height="513" loading="lazy" />
      ) : (
        <div className="movie-poster-empty" aria-hidden="true">Нет постера</div>
      )}
      <h3>{movie.title}</h3>
      <p>
        <span className="movie-rating">★ {Number(movie.rating).toFixed(1)}</span>
        <span>{movie.year}</span>
      </p>
    </li>
  );
}
