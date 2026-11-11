import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Для /login и /signup: вошедшему пользователю эти страницы не нужны.
// Возвращаем его туда, откуда его отправил ProtectedRoute, или в профиль.
export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="page-loading" role="status">Проверяем вход…</p>;
  }
  if (user) {
    const from = location.state?.from?.pathname ?? "/profile";
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
