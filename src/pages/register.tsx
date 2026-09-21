import { useState } from "react";
import { register } from "../services/authService";
import "./auth.css";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register(email, password);
      alert("Usuario creado");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Crear cuenta</h2>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
        />
        <button onClick={handleRegister}>Registrarse</button>
        <p className="auth-footer-text">
          ¿Ya tienes cuenta?{" "}
          <button className="auth-switch" onClick={onSwitchToLogin}>
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}