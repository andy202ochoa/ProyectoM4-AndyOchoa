import { useState } from "react";
import { sendEmailVerification, signOut, User } from "firebase/auth";
import { auth } from "../services/firebase";
import "./auth.css";

interface VerifyEmailPageProps {
  user: User;
}

export function VerifyEmailPage({ user }: VerifyEmailPageProps) {
  const [sent, setSent] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setError("");
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (err) {
      setError("No se pudo reenviar el correo. Intenta de nuevo en unos minutos.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckAgain = async () => {
    setError("");
    setIsChecking(true);
    try {
      await user.reload();
      // onAuthStateChanged no se dispara solo con reload(), así que forzamos
      // una recarga de la página para que App.tsx vuelva a leer emailVerified.
      window.location.reload();
    } catch (err) {
      setError("No se pudo comprobar el estado. Intenta de nuevo.");
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verifica tu correo</h2>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <p className="auth-footer-text">
          Te enviamos un enlace de verificación a <strong>{user.email}</strong>.
          Ábrelo desde tu correo y luego vuelve aquí.
        </p>

        <button type="button" onClick={handleCheckAgain} disabled={isChecking}>
          {isChecking ? "Comprobando..." : "Ya verifiqué mi correo"}
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={handleResend}
          disabled={isResending || sent}
        >
          {isResending ? "Enviando..." : sent ? "Correo reenviado" : "Reenviar correo"}
        </button>

        <p className="auth-footer-text">
          <button type="button" className="auth-switch" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </p>
      </div>
    </div>
  );
}
