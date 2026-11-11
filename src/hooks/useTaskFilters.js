import { useSearchParams } from "react-router-dom";
import { CATEGORIES, SORT_OPTIONS } from "../utils/tasks.js";

const STATUSES = ["all", "active", "completed"];
const PAGE_SIZES = [6, 12, 24];

// Фильтры списка живут в URL (?q=&category=&status=&sort=&page=&size=).
// Хук читает их, подменяет некорректные значения и умеет менять URL.
export function useTaskFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");
  const page = Number(searchParams.get("page"));
  const size = Number(searchParams.get("size"));

  // Значение из URL берём только если оно допустимо, иначе — значение по умолчанию.
  const filters = {
    search: searchParams.get("q") ?? "",
    category: CATEGORIES.includes(category) ? category : "Все",
    status: STATUSES.includes(status) ? status : "all",
    sort: SORT_OPTIONS.includes(sort) ? sort : defaults.sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.includes(size) ? size : defaults.pageSize,
  };

  // changes — например { category: "Учёба" } или { page: 3 }.
  function updateFilters(changes) {
    const next = { ...filters, ...changes };
    // Любой фильтр, кроме самой страницы, возвращает на первую страницу.
    if (!("page" in changes)) next.page = 1;

    const params = new URLSearchParams();
    // Пустые и стандартные значения не пишем, чтобы ссылка была короткой.
    if (next.search) params.set("q", next.search);
    if (next.category !== "Все") params.set("category", next.category);
    if (next.status !== "all") params.set("status", next.status);
    params.set("sort", next.sort);
    params.set("size", String(next.pageSize));
    if (next.page > 1) params.set("page", String(next.page));

    // Ввод в поиске заменяет запись истории, чтобы Back не листал по буквам.
    setSearchParams(params, { replace: "search" in changes });
  }

  return { filters, updateFilters };
}
