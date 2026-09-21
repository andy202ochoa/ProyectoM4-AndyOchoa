import { useState } from "react";
import { login } from "../services/authService";
import "./auth.css";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      alert("Login exitoso");
    } catch (error) {
      console.error(error);
    }
  };

  return (
  <div className="auth-container">
    <div className="auth-card">
      <h2>Login</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
      <button onClick={handleLogin}>Entrar</button>
      <p className="auth-footer-text">
        ¿No tienes cuenta?{" "}
        <button className="auth-switch" onClick={onSwitchToRegister}>Regístrate</button>
      </p>
    </div>
  </div>
  );
}