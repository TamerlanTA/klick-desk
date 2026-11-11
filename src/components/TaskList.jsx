import TaskItem from "./TaskItem.jsx";

export default function TaskList({
  tasks,
  totalCount,
  onToggle,
  onEdit,
  onDelete,
  onResetFilters,
  busy,
}) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state" role="status">
        <h3>{totalCount === 0 ? "Задач пока нет" : "Задачи не найдены"}</h3>
        <p>
          {totalCount === 0
            ? "Добавь задачу кнопкой выше."
            : "Измени запрос или сбрось фильтры."}
        </p>
        {totalCount > 0 && (
          <button
            type="button"
            className="secondary-button"
            onClick={onResetFilters}
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Задачи">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          busy={busy}
        />
      ))}
    </ul>
  );
}
