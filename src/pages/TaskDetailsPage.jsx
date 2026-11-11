import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import TaskDetails from "../components/TaskDetails.jsx";
import TaskForm from "../components/TaskForm.jsx";
import DeleteDialog from "../components/DeleteDialog.jsx";
import { taskService } from "../services/taskService.js";

export default function TaskDetailsPage() {
  // :id из адреса /tasks/:id
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Список с фильтрами, откуда пришли. При прямом открытии ссылки — просто /tasks.
  const backTo = location.state?.backTo ?? "/tasks";

  // editTask — задача в форме редактирования; null, если форма закрыта.
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  async function toggleTask(task) {
    if (busy) return null;
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      // task.id взят из снимка задачи на момент клика, а не из текущего URL.
      const updated = await taskService.update(task.id, { completed: !task.completed });
      setNotice(task.completed ? "Задача возвращена в работу." : "Задача выполнена.");
      return updated;
    } catch (failure) {
      setActionError(failure.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveTask(values) {
    if (busy) return;
    setBusy(true);
    try {
      await taskService.update(id, values);
      // Форма закрывается, TaskDetails монтируется заново и загружает свежие данные.
      setEditTask(null);
      setNotice("Изменения сохранены.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (busy || !deleteTask) return;
    setBusy(true);
    setActionError("");
    try {
      await taskService.remove(deleteTask.id);
      // Задачи больше нет — уходим к списку и передаём сообщение через state.
      navigate(backTo, { state: { notice: "Задача удалена." } });
    } catch (failure) {
      setActionError(failure.message);
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="detail-links" aria-label="Навигация по задачам">
        <Link className="text-button" to={backTo}>
          ← Назад
        </Link>
        <Link className="text-button" to="/tasks">
          Все задачи
        </Link>
      </nav>
      {notice && (
        <p className="success-message" role="status">
          {notice}
        </p>
      )}
      {deleteTask && (
        <DeleteDialog
          task={deleteTask}
          busy={busy}
          error={actionError}
          onClose={() => {
            setDeleteTask(null);
            setActionError("");
          }}
          onConfirm={confirmDelete}
        />
      )}
      {actionError && !deleteTask && (
        <p className="field-error" role="alert">
          {actionError}
        </p>
      )}
      {editTask ? (
        <TaskForm
          task={editTask}
          onSave={saveTask}
          onClose={() => setEditTask(null)}
        />
      ) : (
        // key={id}: при смене адреса компонент создаётся заново со своим запросом.
        <TaskDetails
          key={id}
          id={id}
          busy={busy}
          onToggle={toggleTask}
          onEdit={(task) => {
            setEditTask(task);
            setNotice("");
          }}
          onDelete={(task) => {
            setDeleteTask(task);
            setActionError("");
          }}
        />
      )}
    </>
  );
}
