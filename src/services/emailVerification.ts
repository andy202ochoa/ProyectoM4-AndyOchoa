import { sendEmailVerification, User } from "firebase/auth";

export type VerificationChannel = "ses" | "firebase";

/**
 * Envía el correo de verificación.
 * 1º intenta con AWS SES (función /api/send-verification de Vercel).
 * Si falla (sin configurar, SES en sandbox, sin red…), usa el envío
 * propio de Firebase como respaldo, para que el usuario siempre lo reciba.
 */
export async function sendVerification(user: User): Promise<VerificationChannel> {
  try {
    const token = await user.getIdToken();
    const response = await fetch("/api/send-verification", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      return "ses";
    }
    console.warn("SES no disponible, se usa Firebase. Estado:", response.status);
  } catch (error) {
    console.warn("SES no disponible, se usa Firebase:", error);
  }

  await sendEmailVerification(user);
  return "firebase";
}
