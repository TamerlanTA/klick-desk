import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import RootLayout from "./layouts/RootLayout.jsx";
import TasksLayout from "./layouts/TasksLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import TaskDetailsPage from "./pages/TaskDetailsPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import GuestRoute from "./auth/GuestRoute.jsx";

// Ленивые страницы: их код скачивается отдельным файлом при первом переходе.
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const MoviesPage = lazy(() => import("./pages/MoviesPage.jsx"));

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
        <Route path="movies" element={<MoviesPage />} />
        {/* Только для гостей: вошедшего отправит в профиль. */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>
        {/* Только для вошедших: гостя отправит на /login. */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
