import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPwa } from "../features/pwa/pwaSlice.js";
export default function OfflinePage() {
  const { online } = useSelector(selectPwa);
  return (
    <section className="page offline-page">
      <p className="eyebrow">Klick Desk · офлайн</p>
      <h1>{online ? "Подключение восстановлено" : "Сейчас нет подключения"}</h1>
      <p>
        Твои задачи доступны в этом браузере: их можно создавать, редактировать
        и отмечать выполненными. Сохранённая погода доступна из кэша. Для входа
        в аккаунт нужен интернет.
      </p>
      <div className="detail-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Повторить подключение
        </button>
        <Link className="secondary-button" to="/tasks">
          Открыть задачи
        </Link>
      </div>
    </section>
  );
}
