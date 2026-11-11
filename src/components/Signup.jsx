import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { authErrorMessage } from "../auth/authErrors.js";
import { isFirebaseConfigured } from "../auth/firebase.js";
import AuthSetupNotice from "./AuthSetupNotice.jsx";
import { validateSignup } from "../auth/validation.js";

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function changeField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      // После успеха Firebase сразу считает пользователя вошедшим, GuestRoute уведёт в профиль.
      await action();
    } catch (failure) {
      setError(authErrorMessage(failure));
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const message = validateSignup(values);
    if (message) return setError(message);
    run(() => signUp(values.email.trim(), values.password));
  }

  return (
    <div className="login-card">
      <h1 id="signup-heading">Регистрация</h1>
      {!isFirebaseConfigured && <AuthSetupNotice />}
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={busy}>
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" name="email" type="email" autoComplete="email"
            value={values.email} onChange={changeField} />
          <label htmlFor="signup-password">Пароль (не короче 6 символов)</label>
          <input id="signup-password" name="password" type="password"
            autoComplete="new-password" value={values.password} onChange={changeField} />
          <label htmlFor="signup-confirm">Повтори пароль</label>
          <input id="signup-confirm" name="confirm" type="password"
            autoComplete="new-password" value={values.confirm} onChange={changeField} />
          <button className="primary-button" type="submit">
            {busy ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </button>
          <button className="secondary-button" type="button"
            onClick={() => run(signInWithGoogle)}>
            Продолжить с Google
          </button>
        </fieldset>
      </form>
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="muted-text">
        Уже есть аккаунт? <Link to="/login" state={location.state}>Войти</Link>
      </p>
    </div>
  );
}
