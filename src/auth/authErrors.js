// Коды ошибок Firebase → понятные сообщения на русском.
const MESSAGES = {
  "auth/invalid-credential": "Неверный email или пароль.",
  "auth/wrong-password": "Неверный email или пароль.",
  "auth/user-not-found": "Неверный email или пароль.",
  "auth/invalid-email": "Некорректный email.",
  "auth/email-already-in-use": "Такой email уже зарегистрирован.",
  "auth/weak-password": "Пароль должен быть не короче 6 символов.",
  "auth/too-many-requests": "Слишком много попыток. Подожди немного и попробуй снова.",
  "auth/network-request-failed": "Нет связи с сервером. Проверь интернет.",
  "auth/popup-closed-by-user": "Окно входа через Google закрыто.",
  "auth/cancelled-popup-request": "Окно входа через Google закрыто.",
  "auth/popup-blocked": "Браузер заблокировал окно Google. Разреши всплывающие окна.",
  "auth/unauthorized-domain": "Этот домен не добавлен в Firebase (Authentication → Settings → Authorized domains).",
  "auth/not-configured": "Firebase не настроен: заполни .env.local (см. .env.example) и перезапусти приложение.",
};

export function authErrorMessage(error) {
  return MESSAGES[error?.code] ?? "Не удалось выполнить вход. Попробуй ещё раз.";
}
