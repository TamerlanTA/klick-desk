// Простая проверка формы до запроса в Firebase. Firebase всё равно проверит ещё раз.
export function validateSignup({ email, password, confirm }) {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Укажи корректный email.";
  if (password.length < 6) return "Пароль должен быть не короче 6 символов.";
  if (password !== confirm) return "Пароли не совпадают.";
  return "";
}
