import { taskApi } from "./taskApi.js";
import { cachedQuery, invalidateQueries } from "./queryCache.js";

// Сколько живут ответы про задачи. Потом следующий запрос снова идёт в API.
export const TASKS_CACHE_TTL_MS = 60 * 1000;

// Ключи запросов: всё начинается с "tasks", дальше — что именно и с какими параметрами.
export const taskKeys = {
  all: ["tasks"],
  list: (params) => ["tasks", "list", params],
  detail: (id) => ["tasks", "detail", id],
  everything: () => ["tasks", "everything"],
};

// UI работает с задачами только через этот модуль: чтения кэшируются,
// изменения идут в API и сбрасывают кэш задач.
export const taskService = {
  list({ signal, ...params }) {
    return cachedQuery(taskKeys.list(params), () => taskApi.list({ ...params, signal }), TASKS_CACHE_TTL_MS);
  },
  listAll({ signal } = {}) {
    return cachedQuery(taskKeys.everything(), () => taskApi.listAll({ signal }), TASKS_CACHE_TTL_MS);
  },
  get(id, { signal } = {}) {
    return cachedQuery(taskKeys.detail(id), () => taskApi.get(id, { signal }), TASKS_CACHE_TTL_MS);
  },

  // После любого изменения старые списки, карточки и статистика неверны — удаляем их.
  async create(values) {
    const task = await taskApi.create(values);
    invalidateQueries(taskKeys.all);
    return task;
  },
  async update(id, values) {
    const task = await taskApi.update(id, values);
    invalidateQueries(taskKeys.all);
    return task;
  },
  async remove(id) {
    const result = await taskApi.remove(id);
    invalidateQueries(taskKeys.all);
    return result;
  },

  // «Обновить список» и «Проверить ошибку API» должны реально сходить в API.
  refresh() {
    invalidateQueries(taskKeys.all);
  },
  failNextRequest() {
    invalidateQueries(taskKeys.all);
    taskApi.failNextRequest();
  },
};
