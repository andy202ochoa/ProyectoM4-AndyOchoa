import { useState } from "react";
import { register } from "../services/authService";
import "./auth.css";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const getAuthErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code);

    switch (code) {
      case "auth/invalid-email":
        return "El correo no es válido.";
      case "auth/email-already-in-use":
        return "Este correo ya está registrado.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
      default:
        return "No se pudo crear la cuenta. Intenta nuevamente.";
    }
  }

  return "No se pudo crear la cuenta. Intenta nuevamente.";
};

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Ingresa correo y contraseña.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await register(normalizedEmail, normalizedPassword);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
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

        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          placeholder="Correo"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder="Contraseña"
        />
        <button type="button" onClick={handleRegister} disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta..." : "Registrarse"}
        </button>
        <p className="auth-footer-text">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            className="auth-switch"
            onClick={onSwitchToLogin}
            disabled={isSubmitting}
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}