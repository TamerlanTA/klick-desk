import { Provider } from "react-redux";
import { createAppStore } from "../src/store/store.js";
export function createStoreWrapper() {
  const store = createAppStore();
  return function StoreWrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
