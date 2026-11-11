import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as firebaseAuth from "firebase/auth";

// Настоящий Firebase в тестах не нужен: подменяем модуль firebase.js и функции SDK.
vi.mock("../src/auth/firebase.js", () => ({
  auth: { name: "test-auth" },
  googleProvider: {},
  isFirebaseConfigured: true,
}));

let notify; // колбэк, который приложение передало в onAuthStateChanged
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    notify = callback;
    return () => {};
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

const { default: App } = await import("../src/App.jsx");
const { AuthProvider } = await import("../src/auth/AuthContext.jsx");

const testUser = { email: "test@example.com", uid: "uid-123", providerData: [{ providerId: "password" }] };

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

// Имитируем ответ Firebase: «сейчас вошёл вот этот пользователь» (или null).
const setAuthUser = (user) => act(() => notify(user));

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ProtectedRoute", () => {
  it("waits for Firebase before deciding", () => {
    renderAt("/profile");
    expect(screen.getByText("Проверяем вход…")).toBeTruthy();
  });

  it("redirects a guest from /profile to /login and returns after sign-in", async () => {
    firebaseAuth.signInWithEmailAndPassword.mockImplementation(async () => {
      notify(testUser);
      return { user: testUser };
    });
    renderAt("/profile");
    setAuthUser(null);
    expect(await screen.findByRole("heading", { name: "Вход" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("heading", { name: "Профиль" })).toBeTruthy();
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith({ name: "test-auth" }, "test@example.com", "secret1");
    expect(screen.getByText("uid-123")).toBeTruthy();
    // Email виден в меню на любой странице.
    const account = screen.getByRole("navigation", { name: "Аккаунт" });
    expect(within(account).getByText("test@example.com")).toBeTruthy();
  });

  it("sends a signed-in user from /login to /profile and logs out back to /login", async () => {
    firebaseAuth.signOut.mockImplementation(async () => notify(null));
    renderAt("/login");
    setAuthUser(testUser);
    expect(await screen.findByRole("heading", { name: "Профиль" })).toBeTruthy();
    // Кнопка «Выйти» есть и в меню, и в профиле — нажимаем ту, что в профиле.
    const profile = screen.getByRole("heading", { name: "Профиль" }).parentElement;
    fireEvent.click(within(profile).getByRole("button", { name: "Выйти" }));
    expect(await screen.findByRole("heading", { name: "Вход" })).toBeTruthy();
    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });
});

describe("login and signup forms", () => {
  it("checks the password length before calling Firebase", async () => {
    renderAt("/login");
    setAuthUser(null);
    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "a@b.kz" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
    expect(screen.getByRole("alert").textContent).toContain("не короче 6");
    expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows a Russian message for wrong credentials", async () => {
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValue({ code: "auth/invalid-credential" });
    renderAt("/login");
    setAuthUser(null);
    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "a@b.kz" } });
    fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "wrong-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Неверный email или пароль.");
  });

  it("validates confirm password and shows a taken email error on signup", async () => {
    firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue({ code: "auth/email-already-in-use" });
    renderAt("/signup");
    setAuthUser(null);
    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "a@b.kz" } });
    fireEvent.change(screen.getByLabelText(/^Пароль/), { target: { value: "secret1" } });
    fireEvent.change(screen.getByLabelText("Повтори пароль"), { target: { value: "secret2" } });
    fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    expect(screen.getByRole("alert").textContent).toBe("Пароли не совпадают.");

    fireEvent.change(screen.getByLabelText("Повтори пароль"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Такой email уже зарегистрирован.");
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith({ name: "test-auth" }, "a@b.kz", "secret1");
  });

  it("signs in with Google through a popup", async () => {
    firebaseAuth.signInWithPopup.mockImplementation(async () => notify(testUser));
    renderAt("/login");
    setAuthUser(null);
    fireEvent.click(await screen.findByRole("button", { name: "Войти через Google" }));
    await waitFor(() => expect(firebaseAuth.signInWithPopup).toHaveBeenCalled());
    expect(await screen.findByRole("heading", { name: "Профиль" })).toBeTruthy();
  });
});
