import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.jsx";
import { TASKS_KEY } from "../src/services/taskApi.js";
import initialTasks from "../src/data/tasks.json";
import { getDashboardStats } from "../src/utils/stats.js";

// Показывает текущий адрес, чтобы тест мог проверить URL.
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const currentUrl = () => decodeURIComponent(screen.getByTestId("location").textContent);

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { temperature_2m: 20, apparent_temperature: 17, weather_code: 0, wind_speed_10m: 5 },
      }),
    }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("routes", () => {
  it("renders Home with navigation links and highlights the active NavLink", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Klick Desk");
    const nav = screen.getByRole("navigation", { name: "Разделы" });
    expect(within(nav).getByRole("link", { name: "Главная" }).className).toContain("active");
    expect(within(nav).getByRole("link", { name: "Задачи" }).className).not.toContain("active");
  });

  it("navigates between pages through links without a reload", async () => {
    renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Разделы" });
    fireEvent.click(within(nav).getByRole("link", { name: "О проекте" }));
    expect(await screen.findByRole("heading", { name: "О проекте" })).toBeTruthy();
    expect(currentUrl()).toBe("/about");
    fireEvent.click(within(nav).getByRole("link", { name: "Вход" }));
    expect(await screen.findByRole("heading", { name: "Вход" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
    expect(screen.getByText(/Аутентификация появится в Task 6/)).toBeTruthy();
  });

  it("shows the custom 404 page with a Home link", async () => {
    renderAt("/no-such-page");
    expect(await screen.findByText("404")).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "На главную" }));
    expect(currentUrl()).toBe("/");
  });

  it("shows «not found» for an invalid task ID instead of crashing", async () => {
    renderAt("/tasks/does-not-exist");
    expect(await screen.findByRole("heading", { name: "Задача не найдена" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Все задачи" })).toBeTruthy();
  });

  it("opens task details by URL with 8 fields and Back/All links", async () => {
    const task = initialTasks[0];
    renderAt(`/tasks/${task.id}`);
    expect(await screen.findByRole("heading", { name: task.title })).toBeTruthy();
    for (const label of ["Направление", "Приоритет", "Срок", "Статус", "Создана", "ID"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText(task.id)).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Все задачи" }));
    expect(await screen.findByRole("list", { name: "Задачи" })).toBeTruthy();
    expect(currentUrl()).toBe("/tasks");
  });
});

describe("filters in the URL", () => {
  it("reads filters from the URL", async () => {
    renderAt("/tasks?category=Учёба&status=completed&sort=title&size=12");
    const list = await screen.findByRole("list", { name: "Задачи" });
    expect(screen.getByLabelText("Статус задач").value).toBe("completed");
    expect(screen.getByLabelText("Сортировка задач").value).toBe("title");
    expect(screen.getByLabelText("Задач на странице").value).toBe("12");
    expect(screen.getByRole("button", { name: "Учёба" }).getAttribute("aria-pressed")).toBe("true");
    const expected = initialTasks.filter((task) => task.category === "Учёба" && task.completed);
    expect(within(list).getAllByRole("link")).toHaveLength(Math.min(12, expected.length));
  });

  it("replaces invalid URL values with defaults", async () => {
    renderAt("/tasks?status=bogus&category=Нет&page=-4&size=7&sort=xyz");
    await screen.findByRole("list", { name: "Задачи" });
    expect(screen.getByLabelText("Статус задач").value).toBe("all");
    expect(screen.getByLabelText("Сортировка задач").value).toBe("newest");
    expect(screen.getByLabelText("Задач на странице").value).toBe("6");
    expect(screen.getByRole("button", { name: "Страница 1" }).getAttribute("aria-current")).toBe("page");
  });

  it("writes filter changes to the URL and resets the page to 1", async () => {
    renderAt("/tasks?page=3");
    await screen.findByRole("list", { name: "Задачи" });
    expect(screen.getByRole("button", { name: "Страница 3" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Контент" }));
    await waitFor(() => expect(currentUrl()).toContain("category=Контент"));
    expect(currentUrl()).not.toContain("page=");
    fireEvent.click(await screen.findByRole("button", { name: "Страница 2" }));
    await waitFor(() => expect(currentUrl()).toContain("page=2"));
  });

  it("returns from details to the same filtered list via Back", async () => {
    renderAt("/tasks?category=Контент");
    const list = await screen.findByRole("list", { name: "Задачи" });
    fireEvent.click(within(list).getAllByRole("link")[0]);
    await screen.findByRole("button", { name: "Редактировать задачу" });
    fireEvent.click(screen.getByRole("link", { name: "← Назад" }));
    await screen.findByRole("list", { name: "Задачи" });
    expect(currentUrl()).toBe("/tasks?category=Контент");
  });
});

describe("dashboard", () => {
  it("calculates statistics from API data and the filter changes them", async () => {
    renderAt("/dashboard");
    const stats = await screen.findByLabelText("Статистика");
    const all = getDashboardStats(initialTasks);
    expect(within(stats).getByText("Всего задач").nextSibling.textContent).toBe(String(all.total));
    fireEvent.click(screen.getByRole("button", { name: "Агентство" }));
    const agency = getDashboardStats(initialTasks, "Агентство");
    expect(within(stats).getByText("Всего задач").nextSibling.textContent).toBe(String(agency.total));
    expect(within(stats).getByText("Выполнено").nextSibling.textContent).toBe(String(agency.completed));
    expect(agency.total).toBeLessThan(all.total);
  });

  it("uses saved tasks, not hardcoded numbers", async () => {
    localStorage.setItem(
      TASKS_KEY,
      JSON.stringify({ version: 2, tasks: initialTasks.slice(0, 3) }),
    );
    renderAt("/dashboard");
    const stats = await screen.findByLabelText("Статистика");
    expect(within(stats).getByText("Всего задач").nextSibling.textContent).toBe("3");
  });
});
