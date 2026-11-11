import { Link, NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Главная", end: true },
  { to: "/tasks", label: "Задачи" },
  { to: "/dashboard", label: "Дашборд" },
  { to: "/about", label: "О проекте" },
  { to: "/login", label: "Вход" },
];

export default function NavBar() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Klick Desk — главная">
          <span className="brand-wordmark">
            klick<span className="brand-dot">.</span>
          </span>
          <span className="brand-product">desk</span>
        </Link>
        <nav className="main-nav" aria-label="Разделы">
          {LINKS.map((link) => (
            // NavLink сам добавляет класс active для текущего раздела.
            // end у «/»: иначе главная подсвечивалась бы на любой странице.
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
