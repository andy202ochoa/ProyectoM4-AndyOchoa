import { useState } from "react";
import { loginWithGoogle, register } from "../services/authService";
import "./auth.css";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const getAuthErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code);

    switch (code) {
      case "auth/invalid-email":
        return "El gmail que uso no existe o es invalido entente de nuevo";
      case "auth/email-already-in-use":
        return "El gmail que uso no existe o es invalido entente de nuevo";
      default:
        return "El gmail que uso no existe o es invalido entente de nuevo";
    }
  }

  return "El gmail que uso no existe o es invalido entente de nuevo";
};

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

    if (!normalizedEmail || !rawPassword) {
      setError("El gmail que uso no existe o es invalido entente de nuevo");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("El gmail que uso no existe o es invalido entente de nuevo");
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
      const message = err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";

      setError(
        message === "auth/popup-closed-by-user"
          ? "Se canceló el acceso con Google."
          : "No se pudo continuar con Google. Inténtalo de nuevo."
      );
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
