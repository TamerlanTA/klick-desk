import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <div className="login-card">
      <h1 id="profile-heading">Профиль</h1>
      <dl className="task-details profile-details">
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>UID</dt>
          <dd>{user.uid}</dd>
        </div>
        <div>
          <dt>Способ входа</dt>
          <dd>{user.providerData[0]?.providerId === "google.com" ? "Google" : "Email и пароль"}</dd>
        </div>
      </dl>
      <button
        className="primary-button"
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          // После выхода user станет null, и ProtectedRoute сам отправит на /login.
          signOut();
        }}
      >
        {busy ? "Выходим…" : "Выйти"}
      </button>
    </div>
  );
}
