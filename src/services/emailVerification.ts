import { User } from "firebase/auth";

/**
 * Envía el correo de verificación con AWS SES, a través de la función
 * serverless /api/send-verification de Vercel.
 * Si SES no puede enviarlo, lanza un error con el motivo.
 */
export async function sendVerification(user: User): Promise<void> {
  const token = await user.getIdToken();
  const response = await fetch("/api/send-verification", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string; detail?: string };
    console.error("AWS SES no pudo enviar la verificación:", response.status, data);
    throw new Error(data.detail ?? data.error ?? `Error ${response.status}`);
  }
}
