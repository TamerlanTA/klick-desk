import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { installAvailable, selectPwa } from "../features/pwa/pwaSlice.js";
import { activateUpdate, installApp } from "../pwa/register.js";
export default function PwaStatus() {
  const pwa = useSelector(selectPwa);
  const dispatch = useDispatch();
  return (
    <aside className="pwa-status" aria-label="Состояние приложения">
      <span
        role="status"
        className={pwa.online ? "connection-online" : "connection-offline"}
      >
        {pwa.online
          ? "● В сети"
          : "● Без интернета · сохранённые данные доступны"}
      </span>
      {!pwa.online && <Link to="/offline">Офлайн-помощь</Link>}
      {pwa.installAvailable && (
        <button
          type="button"
          className="secondary-button"
          onClick={async () => {
            await installApp();
            dispatch(installAvailable(false));
          }}
        >
          Установить приложение
        </button>
      )}
      {pwa.updateAvailable && (
        <div role="status" className="pwa-update">
          <span>
            Доступна новая версия. Сохрани открытую форму перед обновлением.
          </span>
          <button
            type="button"
            className="primary-button"
            onClick={activateUpdate}
          >
            Обновить приложение
          </button>
        </div>
      )}
    </aside>
  );
}
