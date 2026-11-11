import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App.jsx";
import { AuthProvider } from "../src/auth/AuthContext.jsx";

// В тестах вместо BrowserRouter — MemoryRouter: адрес задаётся прямо в тесте.
export function renderApp(path = "/tasks", wrapper) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
    { wrapper },
  );
}
