// Función serverless de Vercel: envía el correo de verificación de TaskFlow
// usando AWS SES. Reemplaza a la Cloud Function de Firebase (que exigía el
// plan Blaze): en Vercel Hobby esto es gratis.
//
// Flujo:
//   1. El frontend manda el token de sesión de Firebase del usuario.
//   2. Comprobamos el token con firebase-admin (así nadie puede usar esta
//      función para mandar correos a direcciones ajenas).
//   3. Firebase genera el enlace de verificación oficial (el mismo que
//      marca emailVerified = true al abrirlo).
//   4. Enviamos ese enlace con AWS SES, con nuestro propio diseño.

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Tipos mínimos de la petición/respuesta de Vercel (evita instalar @vercel/node)
interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

// Variables de entorno (se configuran en Vercel, NUNCA con prefijo VITE_).
// Ojo: Vercel reserva los nombres AWS_*, por eso usamos SES_*.
const {
  FIREBASE_SERVICE_ACCOUNT,
  SES_ACCESS_KEY_ID,
  SES_SECRET_ACCESS_KEY,
  SES_REGION = "us-east-2",
  SES_FROM_EMAIL,
  APP_URL = "https://proyecto-m4-andy-ochoa.vercel.app",
} = process.env;

function getAdminAuth() {
  if (!getApps().length) {
    // FIREBASE_SERVICE_ACCOUNT = contenido completo del .json de la cuenta de servicio
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getAuth();
}

function buildEmail(link: string) {
  const text =
    "¡Bienvenido a TaskFlow!\n\n" +
    "Confirma que este correo es tuyo abriendo este enlace:\n" +
    `${link}\n\n` +
    "Si no creaste una cuenta en TaskFlow, ignora este mensaje.";

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="margin-top:0">¡Bienvenido a TaskFlow! ✅</h2>
    <p>Confirma que este correo es tuyo para empezar a usar tus tareas y notas.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">
        Verificar mi correo
      </a>
    </p>
    <p style="font-size:12px;color:#6b7280">Si el botón no funciona, copia este enlace en tu navegador:<br>${link}</p>
    <p style="font-size:12px;color:#6b7280">Si no creaste una cuenta en TaskFlow, ignora este mensaje.</p>
  </div>`;

  return { text, html };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!FIREBASE_SERVICE_ACCOUNT || !SES_ACCESS_KEY_ID || !SES_SECRET_ACCESS_KEY || !SES_FROM_EMAIL) {
    console.error("Faltan variables de entorno para enviar la verificación.");
    return res.status(500).json({ error: "Servidor sin configurar" });
  }

  // 1. Token de sesión de Firebase: "Authorization: Bearer <token>"
  const header = req.headers.authorization;
  const authHeader = Array.isArray(header) ? header[0] : header;
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: "Falta el token de sesión" });
  }

  try {
    const adminAuth = getAdminAuth();

    // 2. Usamos el correo del token, no uno enviado por el cliente
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email) {
      return res.status(400).json({ error: "La cuenta no tiene correo" });
    }
    if (decoded.email_verified) {
      return res.status(200).json({ sent: false, alreadyVerified: true });
    }

    // 3. Enlace oficial de verificación de Firebase (al abrirlo vuelve a la app)
    const link = await adminAuth.generateEmailVerificationLink(decoded.email, { url: APP_URL });

    // 4. Envío con AWS SES
    const ses = new SESClient({
      region: SES_REGION,
      credentials: { accessKeyId: SES_ACCESS_KEY_ID, secretAccessKey: SES_SECRET_ACCESS_KEY },
    });
    const { text, html } = buildEmail(link);

    const result = await ses.send(
      new SendEmailCommand({
        Source: `TaskFlow <${SES_FROM_EMAIL}>`,
        Destination: { ToAddresses: [decoded.email] },
        Message: {
          Subject: { Data: "Verifica tu correo — TaskFlow", Charset: "UTF-8" },
          Body: {
            Text: { Data: text, Charset: "UTF-8" },
            Html: { Data: html, Charset: "UTF-8" },
          },
        },
      })
    );

    return res.status(200).json({ sent: true, messageId: result.MessageId });
  } catch (error) {
    // Ej.: token inválido, o SES en sandbox con un destinatario sin verificar.
    // El frontend usará la verificación de Firebase como respaldo.
    console.error("Error enviando verificación con SES:", error);
    return res.status(502).json({ error: "No se pudo enviar el correo con SES" });
  }
}
