// Función serverless de Vercel: envía por email (AWS SES) el resumen del
// estado de las tareas del usuario autenticado.
//
// Flujo:
//   1. El frontend manda el token de sesión de Firebase + el resumen (asunto y texto).
//   2. Validamos el token con Firebase y obtenemos el correo del usuario.
//   3. Enviamos el resumen con AWS SES SOLO a ese correo.
// Las credenciales de AWS existen únicamente aquí (variables de entorno de Vercel).

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getBearerToken, getUserFromToken } from './_lib/firebaseUser.js';

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

const {
  VITE_FIREBASE_API_KEY,
  SES_ACCESS_KEY_ID,
  SES_SECRET_ACCESS_KEY,
  SES_REGION = 'us-east-2',
  SES_FROM_EMAIL,
} = process.env;

const MAX_SUBJECT = 150;
const MAX_TEXT = 20_000;

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildHtml(subject: string, text: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="margin-top:0">📋 ${escapeHtml(subject)}</h2>
    <pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap;margin:0">${escapeHtml(text)}</pre>
    <p style="font-size:12px;color:#6b7280;margin-top:24px">Enviado desde TaskFlow con AWS SES.</p>
  </div>`;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!VITE_FIREBASE_API_KEY || !SES_ACCESS_KEY_ID || !SES_SECRET_ACCESS_KEY || !SES_FROM_EMAIL) {
    console.error('Faltan variables de entorno para enviar el resumen.');
    return res.status(500).json({ error: 'Servidor sin configurar' });
  }

  const idToken = getBearerToken(req.headers.authorization);
  if (!idToken) {
    return res.status(401).json({ error: 'Falta el token de sesión' });
  }

  // Validación del cuerpo: { subject: string, text: string }
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as
    | { subject?: unknown; text?: unknown }
    | undefined;
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!subject || !text || subject.length > MAX_SUBJECT || text.length > MAX_TEXT) {
    return res.status(400).json({ error: 'Resumen inválido' });
  }

  try {
    const user = await getUserFromToken(idToken, VITE_FIREBASE_API_KEY);
    if (!user) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Debes verificar tu correo primero' });
    }

    const ses = new SESClient({
      region: SES_REGION,
      credentials: { accessKeyId: SES_ACCESS_KEY_ID, secretAccessKey: SES_SECRET_ACCESS_KEY },
    });

    const result = await ses.send(
      new SendEmailCommand({
        Source: `TaskFlow <${SES_FROM_EMAIL}>`,
        Destination: { ToAddresses: [user.email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: buildHtml(subject, text), Charset: 'UTF-8' },
          },
        },
      })
    );

    return res.status(200).json({ sent: true, to: user.email, messageId: result.MessageId });
  } catch (error) {
    // Ej.: SES en sandbox con un destinatario sin verificar ("Email address is not verified")
    console.error('Error enviando el resumen con SES:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: 'No se pudo enviar el correo con SES', detail });
  }
}
