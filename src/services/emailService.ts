import { User } from 'firebase/auth';
import { TaskSummary } from '../utils/taskSummary';

/**
 * Pide a la función serverless /api/send-summary (Vercel) que envíe el
 * resumen de tareas por email con AWS SES.
 *
 * El frontend nunca habla con AWS directamente: solo manda el token de
 * sesión de Firebase. Las credenciales de AWS viven únicamente en Vercel.
 * El correo siempre se envía a la dirección del usuario autenticado.
 */
export async function sendTaskSummaryEmail(user: User, summary: TaskSummary): Promise<void> {
  const token = await user.getIdToken();

  const response = await fetch('/api/send-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(summary),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string; detail?: string };
    console.error('AWS SES no pudo enviar el resumen:', response.status, data);
    throw new Error(data.detail ?? data.error ?? `Error ${response.status}`);
  }
}
