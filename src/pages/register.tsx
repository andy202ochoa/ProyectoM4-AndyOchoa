import { useState } from "react";
import { loginWithGoogle, register } from "../services/authService";
import { getAuthErrorMessage, validateAuthForm } from "../utils/authErrors";
import "./auth.css";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const rawPassword = password; // No usamos .trim() para conservar la contraseña exacta

    const validationError = validateAuthForm(normalizedEmail, rawPassword, "register");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await register(normalizedEmail, rawPassword);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
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
        <h2>Crear cuenta</h2>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="Correo"
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Contraseña"
            autoComplete="new-password"
          />
          <button type="submit" disabled={isSubmitting || isGoogleLoading}>
            {isSubmitting ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleRegister}
          disabled={isSubmitting || isGoogleLoading}
        >
          {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        <p className="auth-footer-text">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            className="auth-switch"
            onClick={onSwitchToLogin}
            disabled={isSubmitting || isGoogleLoading}
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}
