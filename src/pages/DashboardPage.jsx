import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { taskService } from "../services/taskService.js";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllTasks,
  selectDashboardStats,
  selectTaskRevision,
} from "../features/tasks/tasksSlice.js";
import { CATEGORIES, formatDueDate } from "../utils/tasks.js";

// Ссылка на список с готовыми фильтрами в URL.
function tasksLink(params) {
  return `/tasks?${new URLSearchParams(params)}`;
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.tasks.all);
  const loadState = status === "idle" ? "loading" : status;
  const taskRevision = useSelector(selectTaskRevision);
  const [revision, setRevision] = useState(0);
  const [category, setCategory] = useState("Все");
  const stats = useSelector((state) => selectDashboardStats(state, category));
  useEffect(() => {
    const request = dispatch(fetchAllTasks());
    return () => request.abort();
  }, [dispatch, revision, taskRevision]);

  const categoryParam = category === "Все" ? {} : { category };

  return (
    <section
      className="page dashboard-page"
      aria-labelledby="dashboard-heading"
    >
      <div className="panel-heading">
        <h1 id="dashboard-heading">Дашборд</h1>
        <button
          type="button"
          className="secondary-button"
          disabled={loadState === "loading"}
          onClick={() => {
            taskService.refresh();
            setRevision((value) => value + 1);
          }}
        >
          Обновить данные
        </button>
      </div>
      <div
        className="category-filters"
        role="group"
        aria-label="Фильтр дашборда"
      >
        {["Все", ...CATEGORIES].map((item) => (
          <button
            key={item}
            type="button"
            className="filter-button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loadState === "loading" ? (
        <p className="list-loading" role="status">
          Считаем статистику…
        </p>
      ) : loadState === "error" ? (
        <div className="list-error">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRevision((value) => value + 1)}
          >
            Повторить загрузку
          </button>
        </div>
      ) : (
        <>
          <div className="stat-grid" aria-label="Статистика">
            <Link className="stat-card" to={tasksLink(categoryParam)}>
              <span>Всего задач</span>
              <strong>{stats.total}</strong>
            </Link>
            <Link
              className="stat-card"
              to={tasksLink({ ...categoryParam, status: "completed" })}
            >
              <span>Выполнено</span>
              <strong>{stats.completed}</strong>
              <small>{stats.progress}% от выбранных</small>
            </Link>
            <Link
              className="stat-card"
              to={tasksLink({ ...categoryParam, status: "active" })}
            >
              <span>В работе</span>
              <strong>{stats.active}</strong>
              <small>высокий приоритет: {stats.urgent}</small>
            </Link>
            <Link
              className="stat-card is-warning"
              to={tasksLink({
                ...categoryParam,
                status: "active",
                sort: "dueDate",
              })}
            >
              <span>Просрочено</span>
              <strong>{stats.overdue}</strong>
              <small>срок раньше сегодняшнего</small>
            </Link>
          </div>

          <div className="breakdown-grid">
            <section className="breakdown" aria-labelledby="by-category">
              <h2 id="by-category">По направлениям</h2>
              <ul>
                {stats.byCategory.map((row) => (
                  <li
                    key={row.name}
                    className={row.name === category ? "is-selected" : ""}
                  >
                    <Link to={tasksLink({ category: row.name })}>
                      {row.name}
                    </Link>
                    <span>
                      {row.completed} из {row.total} готово
                    </span>
                    <progress
                      max={row.total || 1}
                      value={row.completed}
                      aria-label={`Готово в направлении ${row.name}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
            <section className="breakdown" aria-labelledby="by-priority">
              <h2 id="by-priority">По приоритетам</h2>
              <ul>
                {stats.byPriority.map((row) => (
                  <li key={row.name}>
                    <Link
                      to={tasksLink({ ...categoryParam, sort: "priority" })}
                    >
                      {row.name}
                    </Link>
                    <span>
                      {row.active} в работе · {row.total} всего
                    </span>
                    <progress
                      max={row.total || 1}
                      value={row.total - row.active}
                      aria-label={`Готово с приоритетом ${row.name}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="breakdown" aria-labelledby="overdue-heading">
            <h2 id="overdue-heading">Самые давние просроченные</h2>
            {stats.overdueTasks.length === 0 ? (
              <p className="muted-text">Просроченных задач нет.</p>
            ) : (
              <ul>
                {stats.overdueTasks.map((task) => (
                  <li key={task.id}>
                    <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                    <span className="overdue">
                      {formatDueDate(task.dueDate)} · {task.category}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
