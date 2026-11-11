import { SORT_OPTIONS } from "../utils/tasks.js";

const KEY = "klick-desk.settings.v1";

export function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return {
      sort: SORT_OPTIONS.includes(saved?.sort) ? saved.sort : "newest",
      pageSize: [6, 12, 24].includes(saved?.pageSize) ? saved.pageSize : 6,
    };
  } catch {
    return { sort: "newest", pageSize: 6 };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Необязательные настройки не блокируют работу с задачами.
  }
}
