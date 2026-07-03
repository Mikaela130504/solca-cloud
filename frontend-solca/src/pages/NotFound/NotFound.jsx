import { Link } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import { ROUTES } from "../../utils/constants.js";
import "./NotFound.css";

export default function NotFound() {
  return (
    <main className="not-found">
      <section>
        <span>404</span>
        <h1>Pagina no encontrada</h1>
        <p>La ruta solicitada no existe dentro del frontend SOLCA.</p>
        <Link to={ROUTES.dashboard}>
          <Button>Volver al dashboard</Button>
        </Link>
      </section>
    </main>
  );
}
