import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Toast from "../../components/common/Toast.jsx";
import LoginLayout from "../../layouts/LoginLayout.jsx";
import useAuth from "../../hooks/useAuth.js";
import useForm from "../../hooks/useForm.js";
import { ROUTES } from "../../utils/constants.js";
import { required, rule } from "../../utils/validators.js";
import logo from "../../assets/imagenes/logo-solca.webp";
import "./Login.css";

const initialValues = {
  username: "",
  password: "",
  remember: true,
};

const rules = {
  username: [rule(required, "Ingrese el usuario institucional.")],
  password: [rule(required, "Ingrese la contraseña.")],
};

export default function Login() {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const form = useForm(initialValues, rules);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;

    try {
      await login(form.values);
      navigate(location.state?.from?.pathname || ROUTES.dashboard, { replace: true });
    } catch (error) {
      setToast(error.message || "No fue posible iniciar sesion.");
    }
  };

  return (
    <LoginLayout>
      <section className="login-hero">
        <div className="login-copy">
          <img src={logo} alt="Logo SOLCA" className="login-logo" />
          <h1>Repositorio Clinico Unico SOLCA</h1>
          <p>Acceso seguro para la red hospitalaria oncologica multi-sede.</p>
          <div className="login-metrics">
            <span>HCE</span>
            <span>Laboratorio</span>
            <span>Imagenología</span>
            <span>Repositorio</span>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div>
            <span className="eyebrow">Acceso institucional</span>
            <h2>Iniciar sesion</h2>
          </div>

          <Input
            label="Usuario"
            name="username"
            value={form.values.username}
            onChange={form.handleChange}
            error={form.errors.username}
            autoComplete="username"
            placeholder="usuario.solca"
          />

          <div className="password-field">
            <Input
              label="Contrasena"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.values.password}
              onChange={form.handleChange}
              error={form.errors.password}
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <label className="check-row">
            <input name="remember" type="checkbox" checked={form.values.remember} onChange={form.handleChange} />
            <span>Recordar sesion en este equipo</span>
          </label>

          <Button type="submit" loading={loading}>Ingresar</Button>
        </form>
      </section>
      <Toast message={toast} type="error" onClose={() => setToast("")} />
    </LoginLayout>
  );
}
