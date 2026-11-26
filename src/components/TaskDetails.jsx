import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTaskDetails,
  selectCurrentTask,
  selectTaskRevision,
} from "../features/tasks/tasksSlice.js";
import { formatDueDate } from "../utils/tasks.js";

export default function TaskDetails({ id, onEdit, onDelete, onToggle, busy }) {
  const dispatch = useDispatch();
  const current = useSelector(selectCurrentTask);
  const details = useSelector((state) => state.tasks.details);
  const taskRevision = useSelector(selectTaskRevision);
  const task = details.id === id ? current : null;
  const error = details.id === id ? details.error : "";
  const notFound = details.id === id && details.notFound;
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const request = dispatch(fetchTaskDetails(id));
    return () => request.abort();
  }, [dispatch, id, revision, taskRevision]);

  return (
    <section className="detail-view" aria-labelledby="detail-heading">
      {notFound ? (
        <div className="list-error">
          <h2 id="detail-heading">Задача не найдена</h2>
          <p>
            Задачи с ID «{id}» нет. Возможно, она удалена или ссылка неверная.
          </p>
        </div>
      ) : error ? (
        <div className="list-error">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRevision((value) => value + 1)}
          >
            Повторить
          </button>
        </div>
      ) : !task ? (
        <p role="status">Загружаем задачу…</p>
      ) : (
        <>
          <h2 id="detail-heading">{task.title}</h2>
          <p className="detail-description">
            {task.description || "Описание не добавлено."}
          </p>
          <dl className="task-details">
            <div>
              <dt>Направление</dt>
              <dd>{task.category}</dd>
            </div>
            <div>
              <dt>Приоритет</dt>
              <dd>{task.priority}</dd>
            </div>
            <div>
              <dt>Срок</dt>
              <dd>
                <time dateTime={task.dueDate}>
                  {formatDueDate(task.dueDate)} {task.dueDate.slice(0, 4)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Статус</dt>
              <dd>{task.completed ? "Готово" : "В работе"}</dd>
            </div>
            <div>
              <dt>Создана</dt>
              <dd>
                {task.createdAt && Number.isFinite(Date.parse(task.createdAt))
                  ? new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "medium",
                      timeZone: "Asia/Almaty",
                    }).format(new Date(task.createdAt))
                  : "Дата не сохранена"}
              </dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{task.id}</dd>
            </div>
          </dl>
          <div className="detail-actions">
            <button
              type="button"
              className="primary-button"
              disabled={busy}
              onClick={() => onToggle(task)}
            >
              {busy
                ? "Сохраняем…"
                : task.completed
                  ? "Вернуть в работу"
                  : "Отметить выполненной"}
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={busy}
              onClick={() => onEdit(task)}
            >
              Редактировать задачу
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => onDelete(task)}
            >
              Удалить задачу
            </button>
          </div>
        </>
      )}
    </section>
  );
}
