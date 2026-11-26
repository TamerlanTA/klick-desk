import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const LINKS = [
  { to: "/", label: "Главная", end: true },
  { to: "/tasks", label: "Задачи" },
  { to: "/dashboard", label: "Дашборд" },
  { to: "/movies", label: "Фильмы" },
  { to: "/about", label: "О проекте" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Klick Desk — главная">
          <span className="brand-wordmark">
            klick<span className="brand-dot">.</span>
          </span>
          <span className="brand-product">desk</span>
        </Link>
        <button
          className="menu-toggle secondary-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? "Закрыть меню" : "Меню"}
        </button>
        <nav
          id="main-navigation"
          className={`main-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Разделы"
        >
          {LINKS.map((link) => (
            // NavLink сам добавляет класс active для текущего раздела.
            // end у «/»: иначе главная подсвечивалась бы на любой странице.
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        {/* Пока Firebase проверяет сессию, ничего не показываем, чтобы «Вход» не мигал. */}
        {!loading && (
          <nav className="auth-nav" aria-label="Аккаунт">
            {user ? (
              <>
                <NavLink to="/profile" title="Профиль">
                  {user.email}
                </NavLink>
                <button type="button" className="text-button" onClick={signOut}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Вход</NavLink>
                <NavLink to="/signup">Регистрация</NavLink>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
