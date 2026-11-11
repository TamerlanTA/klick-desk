import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Пускает дальше только вошедшего пользователя. Гостя отправляет на /login
// и запоминает в state.from, куда он хотел попасть.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Пока Firebase проверяет сессию, не решаем: иначе после F5 вошедшего выкинуло бы на /login.
  if (loading) {
    return <p className="page-loading" role="status">Проверяем вход…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
