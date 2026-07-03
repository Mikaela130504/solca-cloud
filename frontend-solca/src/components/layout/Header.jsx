import Button from "../common/Button.jsx";
import useAuth from "../../hooks/useAuth.js";
import useClock from "../../hooks/useClock.js";
import { formatDate, formatTime } from "../../utils/helpers.js";

export default function Header() {
  const { user, logout } = useAuth();
  const now = useClock();

  return (
    <header className="topbar">
      <div>
        <p>{formatDate(now)}</p>
        <strong>{formatTime(now)}</strong>
      </div>
      <div className="user-panel">
        <div className="avatar" aria-hidden="true">
          {user?.name?.slice(0, 2).toUpperCase() || "DR"}
        </div>
        <div>
          <strong>{user?.name}</strong>
          <span>{user?.role} · {user?.branch}</span>
        </div>
        <Button variant="secondary" onClick={logout}>Salir</Button>
      </div>
    </header>
  );
}
