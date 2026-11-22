import { useState } from "react";
import { login, loginWithGoogle } from "../services/authService";
import { getAuthErrorMessage, validateAuthForm } from "../utils/authErrors";
import "./auth.css";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const rawPassword = password; // No usamos .trim() para conservar la contraseña exacta

    const validationError = validateAuthForm(normalizedEmail, rawPassword, "login");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login(normalizedEmail, rawPassword);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar sesión</h2>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="Correo"
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Contraseña"
            autoComplete="current-password"
          />
          <button type="submit" disabled={isSubmitting || isGoogleLoading}>
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleLoading}
        >
          {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        <p className="auth-footer-text">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            className="auth-switch"
            onClick={onSwitchToRegister}
            disabled={isSubmitting || isGoogleLoading}
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}

//eliminando commits //