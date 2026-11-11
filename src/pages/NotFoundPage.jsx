import { Link, useLocation } from "react-router-dom";

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <section className="page not-found" aria-labelledby="not-found-heading">
      <p className="error-code">404</p>
      <h1 id="not-found-heading">Страница не найдена</h1>
      <p className="muted-text">
        Адреса «{location.pathname}» в Klick Desk нет.
      </p>
      <Link className="primary-button" to="/">
        На главную
      </Link>
    </section>
  );
}
