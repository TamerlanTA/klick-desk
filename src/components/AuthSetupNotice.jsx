// Показывается, если в .env.local нет ключей Firebase: честно говорим, почему вход не работает.
export default function AuthSetupNotice() {
  return (
    <p className="login-note" role="note">
      Firebase не настроен. Скопируй <code>.env.example</code> в{" "}
      <code>.env.local</code>, заполни переменные <code>VITE_FIREBASE_*</code>{" "}
      и перезапусти <code>npm run dev</code>.
    </p>
  );
}
