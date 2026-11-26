import { useEffect, useState } from "react";
import {
  WEATHER_URL,
  describeWeather,
  isValidWeather,
} from "../utils/weather.js";
import Icon from "./Icon.jsx";

export default function WeatherWidget() {
  const [source, setSource] = useState("api");
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12000);

    async function loadWeather() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(WEATHER_URL, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!isValidWeather(data)) throw new Error("Invalid weather response");
        if (isActive) {
          setWeather(data.current);
          setSource(response.headers?.get("X-Klick-Cache") === "hit" ? "cache" : "api");
        }
      } catch {
        if (isActive)
          setError(
            timedOut
              ? "Сервис погоды долго не отвечает. Попробуй ещё раз."
              : "Не удалось загрузить погоду. Проверь подключение и повтори запрос.",
          );
      } finally {
        clearTimeout(timeoutId);
        if (isActive) setIsLoading(false);
      }
    }

    loadWeather();
    // Запрос и таймаут принадлежат этому запуску эффекта.
    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [requestNumber]);

  const description = weather ? describeWeather(weather.weather_code) : null;

  return (
    <section
      className="panel weather-panel"
      aria-labelledby="weather-heading"
      aria-busy={isLoading}
    >
      <div className="panel-heading">
        <h2 id="weather-heading">Алматы</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Обновить погоду"
          title="Обновить погоду"
          disabled={isLoading}
          onClick={() => setRequestNumber((value) => value + 1)}
        >
          <Icon name="reset" size={18} />
        </button>
      </div>
      {isLoading ? (
        <div className="weather-loading" role="status">
          <span className="loading-dot" />
          Загружаем погоду…
        </div>
      ) : error ? (
        <div className="weather-error">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setRequestNumber((value) => value + 1)}
          >
            Повторить
          </button>
        </div>
      ) : (
        weather && (
          <>
            <div className="weather-current">
              <Icon
                name={description.icon}
                size={78}
                className="weather-symbol"
              />
              <div>
                <strong className="temperature">
                  {Math.round(weather.temperature_2m)}°
                </strong>
                <p>{description.label}</p>
              </div>
            </div>
            <dl className="weather-details">
              <div>
                <dt>Ощущается как</dt>
                <dd>{Math.round(weather.apparent_temperature)}°</dd>
              </div>
              <div>
                <dt>Ветер</dt>
                <dd>
                  {Math.round(weather.wind_speed_10m)} <span>км/ч</span>
                </dd>
              </div>
            </dl>
          </>
        )
      )}
      {weather && source === "cache" && <p className="cache-banner is-cache" role="status">Погода из кэша · данные могут быть устаревшими</p>}
      <a
        className="weather-source"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
      >
        Данные Open-Meteo ↗
      </a>
    </section>
  );
}
