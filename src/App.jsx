import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import RootLayout from "./layouts/RootLayout.jsx";
import TasksLayout from "./layouts/TasksLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import TaskDetailsPage from "./pages/TaskDetailsPage.jsx";

// Ленивые страницы: их код скачивается отдельным файлом при первом переходе.
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

// App отвечает только за карту маршрутов.
export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="tasks" element={<TasksLayout />}>
          <Route index element={<TasksPage />} />
          <Route path=":id" element={<TaskDetailsPage />} />
        </Route>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
