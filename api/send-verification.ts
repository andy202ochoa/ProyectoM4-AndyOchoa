// Función serverless de Vercel: envía el correo de verificación de TaskFlow
// usando AWS SES. Reemplaza a la Cloud Function de Firebase (que exigía el
// plan Blaze): en Vercel Hobby esto es gratis.
//
// No usa firebase-admin (sus dependencias fallan al cargarse en Vercel):
// habla directo con las APIs REST oficiales de Firebase Auth.
//
// Flujo:
//   1. El frontend manda el token de sesión de Firebase del usuario.
//   2. Firebase confirma el token y nos dice su correo (así nadie puede usar
//      esta función para mandar correos a direcciones ajenas).
//   3. Con la cuenta de servicio pedimos a Firebase el enlace de verificación
//      oficial (el mismo que marca emailVerified = true al abrirlo).
//   4. Enviamos ese enlace con AWS SES, con nuestro propio diseño.

import { createSign } from "node:crypto";
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

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

// Variables de entorno (se configuran en Vercel).
// Ojo: Vercel reserva los nombres AWS_*, por eso usamos SES_*.
const {
  FIREBASE_SERVICE_ACCOUNT,
  VITE_FIREBASE_API_KEY, // la API key pública de Firebase (ya está en Vercel)
  SES_ACCESS_KEY_ID,
  SES_SECRET_ACCESS_KEY,
  SES_REGION = "us-east-2",
  SES_FROM_EMAIL,
  APP_URL = "https://proyecto-m4-andy-ochoa.vercel.app",
} = process.env;

const IDENTITY_TOOLKIT = "https://identitytoolkit.googleapis.com/v1";

const base64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

/** Paso 2: Firebase valida el token del usuario y devuelve sus datos. */
async function lookupUser(idToken: string) {
  const response = await fetch(`${IDENTITY_TOOLKIT}/accounts:lookup?key=${VITE_FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null; // token inválido o vencido
  const data = (await response.json()) as { users?: { email?: string; emailVerified?: boolean }[] };
  return data.users?.[0] ?? null;
}

/** Token de acceso de Google firmado con la cuenta de servicio (JWT RS256). */
export async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key);
  const assertion = `${header}.${claims}.${base64url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) throw new Error(`No se obtuvo token de Google: ${data.error_description ?? response.status}`);
  return data.access_token;
}

/** Paso 3: enlace oficial de verificación (equivale a generateEmailVerificationLink). */
async function generateVerificationLink(sa: ServiceAccount, email: string): Promise<string> {
  const accessToken = await getAccessToken(sa);
  const response = await fetch(`${IDENTITY_TOOLKIT}/projects/${sa.project_id}/accounts:sendOobCode`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ requestType: "VERIFY_EMAIL", email, returnOobLink: true, continueUrl: APP_URL }),
  });
  const data = (await response.json()) as { oobLink?: string; error?: { message?: string } };
  if (!data.oobLink) throw new Error(`Firebase no devolvió el enlace: ${data.error?.message ?? response.status}`);
  return data.oobLink;
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

  if (!FIREBASE_SERVICE_ACCOUNT || !VITE_FIREBASE_API_KEY || !SES_ACCESS_KEY_ID || !SES_SECRET_ACCESS_KEY || !SES_FROM_EMAIL) {
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
    // 2. Usamos el correo que confirma Firebase, no uno enviado por el cliente
    const user = await lookupUser(idToken);
    if (!user?.email) {
      return res.status(401).json({ error: "Sesión inválida" });
    }
    if (user.emailVerified) {
      return res.status(200).json({ sent: false, alreadyVerified: true });
    }

    // 3. Enlace oficial de verificación de Firebase
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
    const link = await generateVerificationLink(serviceAccount, user.email);

    // 4. Envío con AWS SES
    const ses = new SESClient({
      region: SES_REGION,
      credentials: { accessKeyId: SES_ACCESS_KEY_ID, secretAccessKey: SES_SECRET_ACCESS_KEY },
    });
    const { text, html } = buildEmail(link);

    const result = await ses.send(
      new SendEmailCommand({
        Source: `TaskFlow <${SES_FROM_EMAIL}>`,
        Destination: { ToAddresses: [user.email] },
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
    // Ej.: SES en sandbox con un destinatario sin verificar
    // ("Email address is not verified"). El motivo se devuelve en "detail".
    console.error("Error enviando verificación con SES:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return res.status(502).json({ error: "No se pudo enviar el correo con SES", detail });
  }
}
