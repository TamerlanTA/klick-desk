import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./styles/styles.css";
import "./styles/pages.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* basename совпадает с base в vite.config.js: сайт лежит в /klick-desk/. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* AuthProvider снаружи App: user доступен в NavBar и на всех страницах. */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
