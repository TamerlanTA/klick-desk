import { CATEGORIES, PRIORITIES, getAlmatyDate } from "./tasks.js";

// Обычная функция: получает задачи из API и возвращает числа для дашборда.
export function getDashboardStats(tasks, category = "Все") {
  const today = getAlmatyDate();
  const selected =
    category === "Все" ? tasks : tasks.filter((task) => task.category === category);
  const completed = selected.filter((task) => task.completed).length;
  const active = selected.filter((task) => !task.completed);
  const overdue = active
    .filter((task) => task.dueDate < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    total: selected.length,
    completed,
    active: active.length,
    overdue: overdue.length,
    progress: selected.length ? Math.round((completed / selected.length) * 100) : 0,
    urgent: active.filter((task) => task.priority === PRIORITIES[0]).length,
    // Разбивка 1: по направлениям (считается по всем задачам, чтобы сравнивать).
    byCategory: CATEGORIES.map((name) => {
      const items = tasks.filter((task) => task.category === name);
      return {
        name,
        total: items.length,
        completed: items.filter((task) => task.completed).length,
      };
    }),
    // Разбивка 2: по приоритетам среди выбранных задач.
    byPriority: PRIORITIES.map((name) => ({
      name,
      total: selected.filter((task) => task.priority === name).length,
      active: active.filter((task) => task.priority === name).length,
    })),
    // Пять самых давних просроченных задач — ссылки на их карточки.
    overdueTasks: overdue.slice(0, 5),
  };
}
