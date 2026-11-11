import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { authErrorMessage } from "../auth/authErrors.js";
import { isFirebaseConfigured } from "../auth/firebase.js";
import AuthSetupNotice from "./AuthSetupNotice.jsx";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Общая обёртка: блокируем кнопки и переводим ошибку Firebase на русский.
  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      // Переход на /profile делает GuestRoute, когда в контексте появится user.
    } catch (failure) {
      setError(authErrorMessage(failure));
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return setError("Укажи email.");
    if (password.length < 6) return setError("Пароль должен быть не короче 6 символов.");
    run(() => signIn(email.trim(), password));
  }

  return (
    <div className="login-card">
      <h1 id="login-heading">Вход</h1>
      {!isFirebaseConfigured && <AuthSetupNotice />}
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={busy}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="email" value={email}
            onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="login-password">Пароль</label>
          <input id="login-password" type="password" autoComplete="current-password"
            value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary-button" type="submit">
            {busy ? "Входим…" : "Войти"}
          </button>
          <button className="secondary-button" type="button"
            onClick={() => run(signInWithGoogle)}>
            Войти через Google
          </button>
        </fieldset>
      </form>
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="muted-text">
        Нет аккаунта?{" "}
        {/* state передаём дальше, чтобы после регистрации вернуться туда же. */}
        <Link to="/signup" state={location.state}>Зарегистрироваться</Link>
      </p>
    </div>
  );
}
