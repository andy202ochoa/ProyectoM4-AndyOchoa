import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando…</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}