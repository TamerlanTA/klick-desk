import { useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import TaskSummary from "../components/TaskSummary.jsx";
import TaskFilters from "../components/TaskFilters.jsx";
import TaskList from "../components/TaskList.jsx";
import TaskForm from "../components/TaskForm.jsx";
import DeleteDialog from "../components/DeleteDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import Icon from "../components/Icon.jsx";
import { readSettings, saveSettings } from "../services/settingsApi.js";
import { taskService } from "../services/taskService.js";
import { useTaskFilters } from "../hooks/useTaskFilters.js";

export default function TasksPage() {
  const { setSummary } = useOutletContext();
  const location = useLocation();
  // Настройки читаются один раз и служат значениями по умолчанию для URL.
  const [settings] = useState(readSettings);
  const { filters, updateFilters } = useTaskFilters(settings);
  const { search, category, status, sort, page, pageSize } = filters;

  const [formTask, setFormTask] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  // Сообщение могло прийти со страницы карточки (например, после удаления).
  const [notice, setNotice] = useState(location.state?.notice ?? "");
  const [result, setResult] = useState({
    items: [], total: 0, page: 1, pageSize,
    totalPages: 1, summary: { total: 0, completed: 0 },
  });
  const [loadState, setLoadState] = useState("loading");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    saveSettings({ sort, pageSize });
  }, [sort, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoadState("loading");
    setError("");
    taskService.list({ search, category, status, sort, page, pageSize,
      signal: controller.signal,
    }).then((data) => {
      if (!active) return;
      setResult(data);
      setSummary(data.summary);
      setLoadState("success");
    }).catch((failure) => {
      if (!active || failure.name === "AbortError") return;
      setError(failure.message);
      setLoadState("error");
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [search, category, status, sort, page, pageSize, revision, setSummary]);

  // Сбрасываем кэш, иначе повторный запрос с теми же фильтрами вернул бы старый ответ.
  function reload() {
    taskService.refresh();
    setRevision((value) => value + 1);
  }

  function changeFilter(changes) {
    updateFilters(changes);
    setNotice("");
  }

  function resetFilters() {
    updateFilters({ search: "", category: "Все", status: "all" });
  }

  function openForm(task = null) {
    setFormTask(task);
    setIsFormOpen(true);
    setNotice("");
    setActionError("");
  }

  async function saveTask(values) {
    if (busy) return;
    setBusy(true);
    try {
      if (formTask) await taskService.update(formTask.id, values);
      else await taskService.create(values);
      setIsFormOpen(false);
      setNotice(formTask ? "Изменения сохранены." : "Задача добавлена.");
      // Новая задача должна оказаться первой: сбрасываем фильтры и сортируем по новизне.
      if (!formTask) {
        updateFilters({ search: "", category: "Все", status: "all", sort: "newest" });
      }
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await taskService.update(task.id, { completed: !task.completed });
      setNotice(
        task.completed ? "Задача возвращена в работу." : "Задача выполнена.",
      );
      reload();
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(task) {
    setDeleteTask(task);
    setActionError("");
  }

  async function confirmDelete() {
    if (busy || !deleteTask) return;
    const itemId = deleteTask.id;
    setBusy(true);
    setActionError("");
    try {
      await taskService.remove(itemId);
      setDeleteTask(null);
      setNotice("Задача удалена.");
      reload();
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="panel-heading">
        <h2 id="tasks-heading">Мои задачи</h2>
        <button className="secondary-button" type="button"
          disabled={busy || loadState === "loading"} onClick={reload}>
          Обновить список
        </button>
        <button className="text-button" type="button"
          disabled={busy || loadState === "loading"}
          onClick={() => { taskService.failNextRequest(); setRevision((value) => value + 1); }}>
          Проверить ошибку API
        </button>
        {!isFormOpen && (
          <button
            className="primary-button"
            type="button"
            disabled={busy || loadState !== "success"}
            onClick={() => openForm()}
          >
            <Icon name="plus" />
            Новая задача
          </button>
        )}
      </div>
      <TaskSummary summary={result.summary} />
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
      {isFormOpen ? (
        <TaskForm
          key={formTask?.id ?? "new"}
          task={formTask}
          onSave={saveTask}
          onClose={() => setIsFormOpen(false)}
        />
      ) : (
        <>
          <TaskFilters
            search={search}
            onSearchChange={(value) => changeFilter({ search: value })}
            category={category}
            onCategoryChange={(value) => changeFilter({ category: value })}
            status={status}
            onStatusChange={(value) => changeFilter({ status: value })}
            sort={sort}
            onSortChange={(value) => changeFilter({ sort: value })}
            pageSize={pageSize}
            onPageSizeChange={(value) => changeFilter({ pageSize: value })}
          />
          {loadState === "loading" ? (
            <p className="list-loading" role="status">
              Загружаем задачи…
            </p>
          ) : loadState === "error" ? (
            <div className="list-error">
              <p role="alert">{error}</p>
              <button
                type="button"
                className="secondary-button"
                onClick={reload}
              >
                Повторить загрузку задач
              </button>
            </div>
          ) : (
            <>
              <TaskList
                tasks={result.items}
                totalCount={result.summary.total}
                busy={busy}
                onToggle={toggleTask}
                onEdit={openForm}
                onDelete={requestDelete}
                onResetFilters={resetFilters}
              />
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                totalPages={result.totalPages}
                total={result.total}
                onPageChange={(value) => updateFilters({ page: value })}
                disabled={busy}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
