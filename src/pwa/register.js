import {
  connectivityChanged,
  updateAvailable,
  installAvailable,
  appInstalled,
} from "../features/pwa/pwaSlice.js";
let registration;
let installPrompt;
export async function installApp() {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = null;
  await prompt.prompt();
  return prompt.userChoice;
}
export function activateUpdate() {
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}
export function initializePwa(store) {
  const sync = () => store.dispatch(connectivityChanged(navigator.onLine));
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    store.dispatch(installAvailable(true));
  });
  window.addEventListener("appinstalled", () => store.dispatch(appInstalled()));
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  let refreshing = false;
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // First installation claims this page without discarding an open form.
    if (!hadController) {
      hadController = true;
      return;
    }
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener("load", async () => {
    try {
      registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        { scope: import.meta.env.BASE_URL, updateViaCache: "none" },
      );
      const check = () =>
        store.dispatch(updateAvailable(Boolean(registration.waiting)));
      check();
      registration.addEventListener("updatefound", () => {
        registration.installing?.addEventListener("statechange", check);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && navigator.onLine)
          registration.update().catch(() => {});
      });
      window.addEventListener("online", () =>
        registration.update().catch(() => {}),
      );
    } catch (error) {
      console.warn("Не удалось включить офлайн-режим", error);
    }
  });
}
