import { StrictMode } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { renderApp } from "./renderApp.jsx";
import TaskDetails from "../src/components/TaskDetails.jsx";
import { taskApi, TASKS_KEY } from "../src/services/taskApi.js";
import initialTasks from "../src/data/tasks.json";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 20,
            apparent_temperature: 17,
            weather_code: 0,
            wind_speed_10m: 5,
          },
        }),
      }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("ignores outdated details when switching tasks even if the API ignores abort", async () => {
  const pending = [];
  vi.spyOn(taskApi, "get").mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  const props = { onEdit: vi.fn(), onDelete: vi.fn(), onToggle: vi.fn(), busy: false };
  const { rerender } = render(<TaskDetails id="old" {...props} />, { wrapper: MemoryRouter });
  rerender(<TaskDetails id="new" {...props} />);
  await act(async () => pending[1]({ ...initialTasks[0], id: "new", title: "Актуальная задача" }));
  await act(async () => pending[0]({ ...initialTasks[1], id: "old", title: "Устаревшая задача" }));
  expect(screen.getByRole("heading", { name: "Актуальная задача" })).toBeTruthy();
  expect(screen.queryByText("Устаревшая задача")).toBe(null);
});

it("loads saved settings and persists changes without component storage access", async () => {
  localStorage.setItem("klick-desk.settings.v1", JSON.stringify({ sort: "title", pageSize: 24 }));
  renderApp("/tasks", StrictMode);
  await screen.findByRole("list", { name: "Задачи" });
  expect(screen.getByLabelText("Сортировка задач").value).toBe("title");
  expect(JSON.parse(localStorage.getItem("klick-desk.settings.v1")).pageSize).toBe(24);
});

it("paginates, resets filters to page one, opens detail and edits a task", async () => {
  renderApp();
  const list = await screen.findByRole("list", { name: "Задачи" });
  expect(within(list).getAllByRole("checkbox")).toHaveLength(6);
  fireEvent.click(screen.getByRole("button", { name: "Страница 2" }));
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Страница 2" })
        .getAttribute("aria-current"),
    ).toBe("page"),
  );
  fireEvent.change(screen.getByLabelText("Сортировка задач"), {
    target: { value: "title" },
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Страница 1" })
        .getAttribute("aria-current"),
    ).toBe("page"),
  );
  const taskButton = within(
    screen.getByRole("list", { name: "Задачи" }),
  ).getAllByRole("link")[0];
  fireEvent.click(taskButton);
  expect(
    await screen.findByRole("button", { name: "Редактировать задачу" }),
  ).toBeTruthy();
  expect(screen.getByText("ID")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Редактировать задачу" }));
  fireEvent.change(screen.getByLabelText("Название задачи"), {
    target: { value: "Отредактировано на защите" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Сохранить", exact: true }),
  );
  expect(await screen.findByText("Изменения сохранены.")).toBeTruthy();
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem(TASKS_KEY)).tasks.some(
        (task) => task.title === "Отредактировано на защите",
      ),
    ).toBe(true),
  );
});

it("creates a validated item, fetches it in detail and deletes it", async () => {
  renderApp();
  await screen.findByRole("list", { name: "Задачи" });
  fireEvent.click(screen.getByRole("button", { name: "Новая задача" }));
  fireEvent.click(screen.getByRole("button", { name: "Добавить задачу" }));
  expect(screen.getByText(/Название должно/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Название задачи"), {
    target: { value: "Новая задача для защиты" },
  });
  fireEvent.change(screen.getByLabelText("Описание"), {
    target: { value: "Проверка list/detail" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Добавить задачу" }));
  fireEvent.click(
    await screen.findByRole("link", {
      name: "Новая задача для защиты",
      exact: true,
    }),
  );
  expect(await screen.findByText("Проверка list/detail")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Удалить задачу", exact: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));
  expect(await screen.findByText("Задача удалена.")).toBeTruthy();
  await screen.findByRole("list", { name: "Задачи" });
  expect(
    screen.queryByRole("link", {
      name: "Новая задача для защиты",
      exact: true,
    }),
  ).toBe(null);
});

it("shows an API error and recovers through Retry", async () => {
  localStorage.setItem(TASKS_KEY, "{broken");
  renderApp();
  expect(
    await screen.findByText(/Сохранённые данные не перезаписаны/),
  ).toBeTruthy();
  localStorage.setItem(
    TASKS_KEY,
    JSON.stringify({ version: 2, tasks: initialTasks }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Повторить загрузку задач" }),
  );
  expect(await screen.findByRole("list", { name: "Задачи" })).toBeTruthy();
});

it("shows an empty main list without fake pagination", async () => {
  localStorage.setItem(TASKS_KEY, JSON.stringify({ version: 2, tasks: [] }));
  renderApp();
  expect(await screen.findByText("Задач пока нет")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Страницы задач" })).toBe(
    null,
  );
  expect(screen.getByAltText("Маскот Клик").getAttribute("src")).toContain(
    "idle",
  );
});

it("reloads through a simulated error and retries successfully", async () => {
  renderApp();
  await screen.findByRole("list", { name: "Задачи" });
  fireEvent.click(screen.getByRole("button", { name: "Проверить ошибку API" }));
  expect(await screen.findByText(/Временная ошибка API/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку задач" }));
  expect(await screen.findByRole("list", { name: "Задачи" })).toBeTruthy();
});

it("finishes the captured task after leaving details without changing another task", async () => {
  renderApp();
  const list = await screen.findByRole("list", { name: "Задачи" });
  const original = JSON.parse(localStorage.getItem(TASKS_KEY)).tasks;
  const first = original.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))[0];
  fireEvent.click(within(list).getAllByRole("link")[0]);
  await screen.findByRole("button", { name: "Редактировать задачу" });
  const action = screen.getByRole("button", { name: first.completed ? "Вернуть в работу" : "Отметить выполненной" });
  fireEvent.click(action);
  expect(screen.getByRole("button", { name: "Сохраняем…" }).disabled).toBe(true);
  // Уходим со страницы карточки, не дожидаясь ответа API.
  fireEvent.click(screen.getByRole("link", { name: "← Назад" }));
  await screen.findByRole("list", { name: "Задачи" });
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem(TASKS_KEY)).tasks.find((task) => task.id === first.id).completed).toBe(!first.completed),
  );
  const saved = JSON.parse(localStorage.getItem(TASKS_KEY)).tasks;
  expect(saved.find((task) => task.id === first.id).completed).toBe(!first.completed);
  expect(saved.filter((task) => task.id !== first.id)).toEqual(original.filter((task) => task.id !== first.id));
});
