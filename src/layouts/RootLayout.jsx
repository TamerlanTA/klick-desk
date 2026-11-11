import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";

// Общая оболочка всех страниц: меню сверху, страница в Outlet, подвал снизу.
export default function RootLayout() {
  return (
    <>
      <NavBar />
      <main className="workspace">
        {/* Пока ленивая страница загружается, показываем fallback. */}
        <Suspense
          fallback={
            <p className="page-loading" role="status">
              Загружаем страницу…
            </p>
          }
        >
          <Outlet />
        </Suspense>
        <footer className="site-footer">
          <span>Klick Desk</span>
          <span>Задачи сохраняются в этом браузере</span>
        </footer>
      </main>
    </>
  );
}
