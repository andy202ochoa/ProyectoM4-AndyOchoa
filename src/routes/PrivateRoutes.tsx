import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

type Props = {
  children: ReactNode;
};

export function PrivateRoute({ children }: Props) {
  const { user } = useAuth();

  if (!user) return <div>No autorizado</div>;

  return <>{children}</>;
}