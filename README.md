# Klick Desk — React: Effects, API, Routes и Auth

Менеджер задач на React + Vite: список, карточка, создание, редактирование, удаление и смена статуса. Интерфейс Klick, таймер фокуса и погода в Алматы.

- Репозиторий: https://github.com/TamerlanTA/klick-desk
- Опубликованное приложение: https://tamerlanta.github.io/klick-desk/

## Задание 6. Server Data, Caching & Firebase Authentication

Добавлены вход через Firebase (email/пароль и Google), защищённый профиль, кэш запросов задач с инвалидацией после изменений и раздел «Фильмы» (TMDB) с кэшем в localStorage на 1 час. Все маршруты, фильтры и пагинация Task 5 сохранены.

| Требование | Реализация |
| --- | --- |
| Переменные окружения `VITE_` | `.env.local` (не в git, `.gitignore`: `.env*`), пример — `.env.example` (исключение `!.env.example`) |
| Инициализация Firebase отдельно | `src/auth/firebase.js`: конфиг только из `import.meta.env`; без ключей Firebase не запускается, страница входа объясняет, что заполнить |
| AuthContext, AuthProvider, useAuth | `src/auth/AuthContext.jsx`; провайдер подключён в `src/main.jsx` |
| onAuthStateChanged, loading | `AuthContext.jsx`: слушатель ставит `user` и снимает `loading`; пока `loading`, защищённые страницы показывают «Проверяем вход…» |
| Сохранение сессии после F5 | стандартная persistence Firebase Web SDK (`browserLocalPersistence`): сессия хранится SDK в IndexedDB, приложение пароль нигде не хранит |
| Signup, login, Google, logout | `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithPopup(GoogleAuthProvider)`, `signOut` — без перезагрузки страницы |
| Ошибки на русском | `src/auth/authErrors.js`: `auth/invalid-credential` → «Неверный email или пароль», `auth/email-already-in-use`, `auth/weak-password`, закрытое окно Google, неразрешённый домен и др. |
| `/login` | `src/components/Login.jsx`: email + пароль (≥ 6 символов), кнопка «Войти через Google» |
| `/signup` | `src/components/Signup.jsx`: email, пароль, повтор пароля; проверка `src/auth/validation.js` |
| `/profile` (защищён) | `src/components/Profile.jsx`: email, UID, способ входа, «Выйти» |
| Редирект гостя | `src/auth/ProtectedRoute.jsx`: `<Navigate to="/login" state={{ from }}>`; после входа — обратно |
| Вошедший на /login, /signup | `src/auth/GuestRoute.jsx` → `/profile` (или туда, откуда пришёл) |
| NavBar по состоянию входа | гость: «Вход», «Регистрация»; вошедший: email (ссылка в профиль) и «Выйти» — на всех страницах |
| Кэш API с ключами | `src/services/queryCache.js` + `src/services/taskService.js`: ключи `["tasks","list",{фильтры}]`, `["tasks","detail",id]`, `["tasks","everything"]`, TTL 60 с |
| Инвалидация после create/update/delete | `taskService.create/update/remove` → `invalidateQueries(["tasks"])` |
| Второй кэш: фильмы | `src/hooks/useMovies.js` + `src/services/movieApi.js`: TMDB `/movie/popular?language=ru-RU`, `localStorage` `klick-desk.movies.v1` = `{ timestamp, movies }`, `MOVIES_TTL_MS = 60 * 60 * 1000` |
| Loading / error / empty | задачи — как в Task 4–5; фильмы — «Загружаем…», ошибка с «Повторить», пустой ответ, отдельное сообщение при отсутствии ключа |
| Устаревшие запросы | `AbortController` + флаг `active` в каждом effect; отменённые и ошибочные ответы в кэш не попадают |
| Архитектура | UI не трогает `localStorage` и не делает `fetch`: задачи — `services/taskService.js`, фильмы — `hooks/useMovies.js` → `services/movieApi.js`, auth — `src/auth/` |
| Ленивая загрузка | `/signup`, `/profile`, `/movies` подключены через `React.lazy`, как страницы Task 5 |

### Стратегия кэширования

**Задачи (кэш в памяти, `src/services/queryCache.js`).**
- *Что:* ответы `list` (по набору фильтров), `get` (по ID) и `listAll` (для дашборда). Каждый ответ лежит под своим ключом: другая страница или фильтр — другой ключ.
- *Когда читается:* при каждом запросе. Если запись моложе 60 секунд — ответ отдаётся из памяти, без задержки API.
- *Когда перезаписывается:* запись нет или она старше 60 секунд → запрос в `taskApi`, успешный ответ сохраняется.
- *Когда сбрасывается:* после любого создания, редактирования, смены статуса или удаления (`invalidateQueries(["tasks"])` — все списки, карточки и статистика), по кнопкам «Обновить список», «Обновить данные» и «Проверить ошибку API», а также при перезагрузке страницы (кэш в памяти). Ошибки и отменённые запросы не кэшируются.

**Фильмы (кэш в `localStorage`, `src/services/movieApi.js`).**
- *Что:* первая страница популярных фильмов TMDB в виде `{ timestamp, movies }` по ключу `klick-desk.movies.v1`.
- *Когда читается:* при открытии `/movies`. Если `Date.now() - timestamp < MOVIES_TTL_MS` (1 час) — фильмы из кэша, баннер «Показано из кэша».
- *Когда перезаписывается:* кэша нет, он старше часа или нажата **Refresh** → запрос в TMDB, новый `{ timestamp, movies }`, баннер «Загружено из API».
- *Когда игнорируется:* Refresh (принудительный запрос), истёкший час, повреждённые данные. Если TMDB недоступен, а старый кэш есть — показываем его и сообщение об ошибке. Без ключа TMDB запрос не делается и кэш не используется: страница объясняет, куда вставить ключ.

### Переменные окружения

Скопировать `.env.example` в `.env.local` и заполнить:

| Переменная | Где взять |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase Console → Project settings → Your apps → Web app → `firebaseConfig` |
| `VITE_TMDB_API_KEY` | themoviedb.org → Settings → API → API Key (v3 auth) |

В Firebase Console нужно включить провайдеры **Email/Password** и **Google** (Authentication → Sign-in method) и добавить `tamerlanta.github.io` в Authentication → Settings → **Authorized domains** — без этого вход через Google на опубликованном сайте не работает. Значения `VITE_` встраиваются в собранный JavaScript при `npm run build`, поэтому `npm run deploy` нужно запускать на машине, где есть заполненный `.env.local`. Конфиг Firebase Web — не секрет (его видит любой браузер); `.env` нужен, чтобы ключи не лежали в исходниках и их можно было поменять без правки кода.

## Задание 5. Routes

Приложение переведено на React Router (`react-router-dom`). `App.jsx` содержит только карту маршрутов. Сущность проекта — задачи, поэтому `items` из задания — это `tasks`.

| Маршрут | Страница | Загрузка |
| --- | --- | --- |
| `/` | Главная: введение, маскот, ссылки на разделы | обычная |
| `/about` | О проекте | lazy |
| `/tasks` | Список задач | обычная |
| `/tasks/:id` | Карточка задачи | обычная |
| `/dashboard` | Дашборд | lazy |
| `/login` | Вход (заглушка до Task 6) | lazy |
| `*` | Своя страница 404 | lazy |

| Требование | Реализация |
| --- | --- |
| React Router, RootLayout, NavBar, Outlet | `src/main.jsx` (BrowserRouter), `src/App.jsx` (Routes), `src/layouts/RootLayout.jsx`, `src/components/NavBar.jsx` |
| Вложенные маршруты | `tasks` → `TasksLayout` с дочерними `index` (список) и `:id` (карточка); таймер и погода в общем макете не сбрасываются при переходе список ↔ карточка |
| App.jsx только маршрутизация | `src/App.jsx`: `lazy` + `<Routes>`, без состояний |
| Разделение по папкам | `pages/`, `components/`, `layouts/`, `services/`, `hooks/`, `styles/`, `utils/` |
| Запросы только через services | `src/services/taskApi.js`, `src/services/settingsApi.js`; страницы и компоненты не трогают `localStorage` |
| Home | `src/pages/HomePage.jsx`: текст, `Mascot`, кнопки и карточки-ссылки на разделы |
| About | `src/pages/AboutPage.jsx`: что это и как работает |
| Login | `src/pages/LoginPage.jsx`: стилизованная форма, данные никуда не отправляются, честная подпись про Task 6 |
| Карточки в списке | `TaskItem` — переиспользуемая карточка задачи, название — `Link` на `/tasks/:id` |
| Поиск, 2+ фильтра, сортировка, пагинация | `TaskFilters` + `Pagination`; фильтры: направление и статус |
| Фильтры в URL | `src/hooks/useTaskFilters.js`: `useSearchParams`, параметры `q, category, status, sort, size, page`; некорректные значения → значения по умолчанию; смена фильтра сбрасывает страницу на 1; поиск заменяет запись истории (`replace`) |
| Loading / error / empty | `src/pages/TasksPage.jsx` — как в Task 4: «Загружаем…», ошибка с повтором, «Задачи не найдены» |
| Карточка по ID | `src/pages/TaskDetailsPage.jsx`: `useParams` → `TaskDetails` делает `taskApi.get(id)` |
| 7+ полей | название, описание, направление, приоритет, срок, статус, дата создания, ID |
| Back и All Tasks | «← Назад» возвращает к списку с теми же фильтрами (`location.state.backTo`), «Все задачи» → `/tasks` |
| Нет задачи / ошибка / устаревший запрос | `NotFoundError` из API → «Задача не найдена»; прочие ошибки → «Повторить»; `AbortController` + флаг `active` |
| Dashboard: 4+ статистики | всего, выполнено (+ %), в работе (+ высокий приоритет), просрочено — `src/utils/stats.js` |
| 2+ разбивки | по направлениям и по приоритетам + список самых давних просроченных |
| Интерактивный фильтр | кнопки направления меняют все статистики без нового запроса |
| Ссылки | карточки статистики и строки ведут на `/tasks?...` с фильтром, просроченные — на `/tasks/:id` |
| Lazy loading | `React.lazy` для About, Dashboard, Login, NotFound; `Suspense` с fallback в `RootLayout` |
| Навигация без перезагрузки | только `Link` / `NavLink`; активный раздел подсвечивается классом `active` |
| Прямые URL, Back/Forward, обновление | `BrowserRouter basename` + SPA-фолбэк GitHub Pages: `public/404.html` и скрипт в `index.html` |
| Сохранённая функциональность | создание, редактирование (в списке и в карточке), удаление с подтверждением, смена статуса, `TaskSummary`, `FocusTimer`, `WeatherWidget`, «Обновить список», «Проверить ошибку API» |

### Почему BrowserRouter, а не HashRouter

GitHub Pages ничего не знает о маршрутах React: на `/klick-desk/tasks/seed-001` сервер ищет файл, не находит и отдаёт `404.html`. Наш `public/404.html` переносит путь в параметр (`/klick-desk/?p=tasks/seed-001`) и открывает приложение, а скрипт в `index.html` до запуска React возвращает адрес обратно через `history.replaceState`. Пользователь видит обычный адрес без `#`. Побочный эффект: в DevTools первый запрос прямой ссылки помечен статусом 404 — это ответ GitHub Pages, само приложение открывается нормально. HashRouter не понадобился.

### Проверено на опубликованном сайте

| URL | Результат |
| --- | --- |
| https://tamerlanta.github.io/klick-desk/ | главная открывается |
| https://tamerlanta.github.io/klick-desk/about | открывается напрямую |
| https://tamerlanta.github.io/klick-desk/login | открывается напрямую |
| https://tamerlanta.github.io/klick-desk/dashboard | открывается напрямую и после обновления, статистика из API |
| https://tamerlanta.github.io/klick-desk/tasks/seed-001 | карточка открывается напрямую и после обновления |
| https://tamerlanta.github.io/klick-desk/tasks/not-a-real-id | «Задача не найдена» |
| https://tamerlanta.github.io/klick-desk/tasks?category=Учёба&status=completed&sort=title&size=12 | фильтры восстановлены из URL |
| https://tamerlanta.github.io/klick-desk/some/missing/page | своя страница 404 |
| Задачи → карточка → Back → Forward | работают без перезагрузки страницы |

## Задание 4

В приложении используются только `useState` и `useEffect`. Собственных хуков, debounce и библиотек для загрузки данных нет. Компоненты не обращаются к `localStorage`: задачи обслуживает `src/services/taskApi.js`, настройки — `src/services/settingsApi.js` (в Task 4 папка называлась `src/api/`). В Task 5 задание требует папку `hooks/`, поэтому появился один собственный хук `useTaskFilters`.

| Требование | Реализация |
| --- | --- |
| Асинхронный API | Promise, случайная задержка 200–699 мс, вероятность ошибки 5% для каждого запроса |
| Загрузка списка | `pages/TasksPage.jsx` (раньше `App.jsx`): useEffect с зависимостями search/category/status/sort/page/pageSize/revision |
| CRUD | `taskApi.list/get/create/update/remove`; форма с валидацией и подтверждение удаления |
| Подробности | `TaskDetails.jsx`: отдельный запрос; название, описание, направление, приоритет, срок, статус, дата создания и ID |
| Дополнительная загрузка | Список не возвращает дату создания; get загружает полную запись |
| Обновление выбранной задачи | Кнопка смены статуса в карточке; ID захватывается до await; конфликтующие действия отключены |
| Состояния | Loading, error с повтором, пустой список, сообщения об успешном сохранении |
| Reload | «Обновить список» увеличивает revision и запускает effect |
| Race conditions | Cleanup: active=false + AbortController; запоздавший ответ не изменяет состояние |
| Проверка ошибок | «Проверить ошибку API» гарантированно проваливает следующий запрос списка; после него доступен повтор |
| Адаптивность | CSS для компьютера и телефона; перенос кнопок и полей |

100 начальных задач находятся в `src/data/tasks.json`. Поиск по названию и описанию, фильтры по направлению/статусу, сортировка и пагинация выполняются в API. Поиск запускает запрос сразу при изменении поля. Сохранённые данные старых версий сохраняются; намеренно пустой список не заполняется заново. Повреждённые данные не перезаписываются, ошибки записи показываются пользователю.

## Запуск и проверка

```sh
npm ci
cp .env.example .env.local   # и заполнить значения
npm run dev
npm run lint
npm test
npm run build
```

Локальная страница: http://localhost:5173/klick-desk/ (например, http://localhost:5173/klick-desk/tasks?status=active или http://localhost:5173/klick-desk/dashboard).

Тесты (53) проверяют вход/регистрацию/Google/выход с моком Firebase, редирект гостя с `/profile` и вошедшего с `/login`, проверку пароля и русские ошибки, кэш задач (повторное чтение без запроса, сброс после изменения, TTL, неудачные ответы не кэшируются), `useMovies` (свежий кэш без запроса, запрос после истечения TTL, Refresh мимо кэша, старый кэш при ошибке API, отсутствие ключа), а также маршруты и NavLink, 404, невалидный ID, карточку по прямому URL, чтение/запись фильтров в URL и подмену некорректных значений, возврат «Назад» к тем же фильтрам, статистику дашборда и её фильтр, а также CRUD, поиск/сортировку/пагинацию, миграцию, ошибки, отмену, устаревшие ответы, захваченный ID при завершении задачи, повтор загрузки и cleanup таймера/погоды. В тестах случайность фиксируется, чтобы сценарии повторялись.

## Структура

- `src/main.jsx`: `BrowserRouter` с `basename`.
- `src/App.jsx`: только маршруты и lazy-страницы.
- `src/layouts/RootLayout.jsx`: NavBar, `Suspense`, `Outlet`, подвал.
- `src/layouts/TasksLayout.jsx`: интро с маскотом, таймер и погода для `/tasks` и `/tasks/:id`.
- `src/pages/`: Home, About, Tasks, TaskDetails, Dashboard, Login, NotFound.
- `src/hooks/useTaskFilters.js`: фильтры списка в URL.
- `src/auth/`: `firebase.js`, `AuthContext.jsx` (AuthProvider, useAuth), `ProtectedRoute.jsx`, `GuestRoute.jsx`, ошибки и проверка формы.
- `src/components/Login.jsx`, `Signup.jsx`, `Profile.jsx`, `MovieCard.jsx`.
- `src/services/taskApi.js`: имитация API и хранилище задач.
- `src/services/queryCache.js`, `src/services/taskService.js`: кэш запросов задач и инвалидация.
- `src/services/movieApi.js`, `src/hooks/useMovies.js`: TMDB и кэш фильмов.
- `src/services/settingsApi.js`: чтение/сохранение настроек сортировки и размера страницы.
- `src/utils/stats.js`: расчёт статистики дашборда.
- `src/styles/`: `styles.css` (стиль Task 4) и `pages.css` (новые страницы).
- `src/components/TaskDetails.jsx`: подробности через отдельный effect.
- `src/components/TaskForm.jsx`: управляемая форма и локальный черновик.
- `src/components/FocusTimer.jsx`: интервал с очисткой.
- `src/components/WeatherWidget.jsx`: fetch с отменой и таймаутом.
- `docs/EFFECTS.md`: объяснение эффектов.
- `docs/DEFENSE.md`: сценарий защиты.

## Публикация

`npm run deploy` собирает приложение и публикует `dist` в ветку `gh-pages` существующего репозитория. Vite base — `/klick-desk/`, `basename` роутера берётся из того же значения (`import.meta.env.BASE_URL`). В `public/404.html` путь `/klick-desk/` записан вручную — при переименовании репозитория его надо поменять вместе с `vite.config.js`. Локальные изменения становятся доступны по публичной ссылке только после публикации.

Данные хранятся отдельно в каждом браузере. Погода требует интернета, задачи используют локальное хранилище.
