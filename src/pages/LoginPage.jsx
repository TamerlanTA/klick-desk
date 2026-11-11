import { useState } from "react";
import { Link } from "react-router-dom";

// Заглушка будущей аутентификации (Task 6). Данные никуда не отправляются.
export default function LoginPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="page login-page" aria-labelledby="login-heading">
      <div className="login-card">
        <h1 id="login-heading">Вход</h1>
        <p className="muted-text">
          Скоро здесь появится личный кабинет. Сейчас задачи хранятся только в
          этом браузере.
        </p>
        <form
          onSubmit={(event) => {
            // Не перезагружаем страницу и ничего не отправляем — просто показываем сообщение.
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" name="email" autoComplete="off" placeholder="you@example.com" />
          <label htmlFor="login-password">Пароль</label>
          <input id="login-password" type="password" name="password" autoComplete="off" placeholder="••••••••" />
          <button className="primary-button" type="submit">
            Войти
          </button>
        </form>
        {submitted && (
          <p className="login-note" role="status">
            Аутентификация появится в Task 6. Пока можно работать без входа.
          </p>
        )}
        <Link className="text-button" to="/tasks">
          Продолжить без входа →
        </Link>
      </div>
    </section>
  );
}
