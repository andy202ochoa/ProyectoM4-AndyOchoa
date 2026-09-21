import { useState } from "react";
import { login } from "../services/authService";
import "./auth.css";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

const getAuthErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code);

    switch (code) {
      case "auth/invalid-email":
        return "El correo no es válido.";
      case "auth/user-disabled":
        return "Esta cuenta está deshabilitada.";
      case "auth/user-not-found":
        return "No existe un usuario con ese correo.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      default:
        return "No se pudo iniciar sesión. Intenta nuevamente.";
    }
  }

  return "No se pudo iniciar sesión. Intenta nuevamente.";
};

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const rawPassword = password; // No usamos .trim() para conservar la contraseña exacta

    if (!normalizedEmail || !rawPassword) {
      setError("Ingresa correo y contraseña.");
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
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            className="auth-switch"
            onClick={onSwitchToRegister}
            disabled={isSubmitting}
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}