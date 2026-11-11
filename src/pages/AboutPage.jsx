import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <article className="page text-page" aria-labelledby="about-heading">
      <h1 id="about-heading">О проекте</h1>
      <p className="lead">
        Klick Desk — менеджер задач на React + Vite. В нём можно создавать,
        редактировать, удалять и отмечать задачи, искать по названию и
        описанию, фильтровать по направлению и статусу, сортировать и листать
        страницы.
      </p>

      <h2>Как это работает</h2>
      <ul>
        <li>
          Данные приходят из имитации API (<code>src/services/taskApi.js</code>):
          Promise, задержка 200–699 мс, 5% случайных ошибок, хранение в
          localStorage. Сначала загружаются 100 задач из JSON.
        </li>
        <li>
          Разделы — отдельные адреса React Router: <code>/tasks</code>,{" "}
          <code>/tasks/:id</code>, <code>/dashboard</code> и другие. Переходы
          происходят без перезагрузки страницы.
        </li>
        <li>
          Фильтры списка записываются в адрес, поэтому ссылкой на выборку
          можно поделиться, а обновление страницы её не сбрасывает.
        </li>
        <li>
          Дашборд считает статистику по ответу API, а не по заранее
          записанным числам.
        </li>
        <li>
          Вход — Firebase Authentication (email и пароль или Google), профиль
          доступен только после входа. Ответы API задач кэшируются и
          сбрасываются после изменений, популярные фильмы TMDB хранятся в кэше
          один час.
        </li>
        <li>
          Рядом со списком — таймер фокуса и текущая погода в Алматы
          (Open-Meteo).
        </li>
      </ul>

      <h2>Стек</h2>
      <p>React 19, React Router, Firebase Auth, Vite, обычный CSS, Vitest и Testing Library. Сайт опубликован на GitHub Pages.</p>

      <p>
        <Link className="primary-button" to="/tasks">
          Перейти к задачам
        </Link>
      </p>
    </article>
  );
}
