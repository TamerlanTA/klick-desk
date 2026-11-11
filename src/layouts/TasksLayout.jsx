import { useState } from "react";
import { Outlet } from "react-router-dom";
import Mascot from "../components/Mascot.jsx";
import FocusTimer from "../components/FocusTimer.jsx";
import WeatherWidget from "../components/WeatherWidget.jsx";

// Общая часть /tasks и /tasks/:id. Таймер живёт здесь, поэтому
// переход «список → карточка → список» не сбрасывает сессию фокуса.
export default function TasksLayout() {
  const [isFocusing, setIsFocusing] = useState(false);
  const [summary, setSummary] = useState({ total: 0, completed: 0 });

  return (
    <>
      <section className="intro">
        <div className="intro-copy">
          <h1>Дела на сегодня.</h1>
          <p>Задачи, фокус и погода в Алматы.</p>
          <time className="today">
            {new Intl.DateTimeFormat("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Almaty",
            }).format(new Date())}
          </time>
        </div>
        <Mascot
          isFocusing={isFocusing}
          allCompleted={summary.total > 0 && summary.completed === summary.total}
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel tasks-panel" aria-labelledby="tasks-heading">
          {/* Дочерняя страница сообщает итоги через context, маскот их показывает. */}
          <Outlet context={{ setSummary }} />
        </section>
        <aside className="utility-rail" aria-label="Фокус и погода">
          <FocusTimer onRunningChange={setIsFocusing} />
          <WeatherWidget />
        </aside>
      </div>
    </>
  );
}
