// Маленький кэш запросов в памяти. Ключ — массив, например
// ["tasks", "list", { page: 2, status: "active" }]: разные параметры → разные записи.
const cache = new Map();
let generation = 0;

function toId(key) {
  return JSON.stringify(key);
}

// Свежая запись → отдаём её без запроса. Нет записи или срок вышел → запрос и сохранение.
export async function cachedQuery(key, fetcher, ttlMs) {
  const entry = cache.get(toId(key));
  if (entry && Date.now() - entry.savedAt < ttlMs) return entry.data;
  const startedGeneration = generation;
  const data = await fetcher();
  // Ошибки и отменённые запросы сюда не доходят, поэтому в кэш не попадают.
  if (startedGeneration === generation) {
    cache.set(toId(key), { key, data, savedAt: Date.now() });
    if (cache.size > 100) cache.delete(cache.keys().next().value);
  }
  return data;
}

// Удаляет все записи, ключ которых начинается с prefix. ["tasks"] — всё про задачи.
export function invalidateQueries(prefix) {
  generation += 1;
  for (const [id, entry] of cache) {
    if (prefix.every((part, index) => toId(entry.key[index]) === toId(part))) {
      cache.delete(id);
    }
  }
}

export function clearQueryCache() {
  generation += 1;
  cache.clear();
}
