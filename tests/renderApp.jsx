import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App.jsx";

// В тестах вместо BrowserRouter — MemoryRouter: адрес задаётся прямо в тесте.
export function renderApp(path = "/tasks", wrapper) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
    { wrapper },
  );
}
