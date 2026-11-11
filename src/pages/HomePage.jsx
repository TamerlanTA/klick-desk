import { Link } from "react-router-dom";
import Mascot from "../components/Mascot.jsx";

const SECTIONS = [
  { to: "/tasks", title: "Задачи", text: "Поиск, фильтры, сортировка и карточки задач." },
  { to: "/dashboard", title: "Дашборд", text: "Сколько сделано, что просрочено и где больше всего дел." },
  { to: "/movies", title: "Фильмы", text: "Популярные фильмы TMDB с кэшем на один час." },
  { to: "/login", title: "Вход", text: "Аккаунт Firebase: email и пароль или Google." },
];

export default function HomePage() {
  return (
    <>
      <section className="intro">
        <div className="intro-copy">
          <h1>Klick Desk — дела без хаоса.</h1>
          <p>
            Личный планировщик: задачи по направлениям, таймер фокуса и погода
            в Алматы. Выбери раздел, чтобы начать.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/tasks">
              Открыть задачи
            </Link>
            <Link className="secondary-button" to="/dashboard">
              Посмотреть дашборд
            </Link>
          </div>
        </div>
        <Mascot isFocusing={false} allCompleted={false} />
      </section>
      <nav className="section-cards" aria-label="Разделы приложения">
        {SECTIONS.map((section) => (
          <Link key={section.to} className="section-card" to={section.to}>
            <strong>{section.title} →</strong>
            <span>{section.text}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
