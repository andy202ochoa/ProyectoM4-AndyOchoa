//Script de prueba INDEPENDIENTE de Firebase: envía un correo real usando
// AWS SES directamente desde tu computadora. No requiere el plan Blaze
// porque no pasa por Cloud Functions — solo usa el SDK de AWS con las
// credenciales del usuario IAM que ya creaste.
//
// Uso:
//   1. npm install @aws-sdk/client-ses dotenv
//   2. Crea un archivo .env.ses (NO lo subas a git) con:
//        AWS_ACCESS_KEY_ID=tu_access_key
//        AWS_SECRET_ACCESS_KEY=tu_secret_key
//        SES_VERIFIED_EMAIL=andy202ochoa@gmail.com
//   3. node test-ses-local.mjs destinatario@ejemplo.com
//
// IMPORTANTE (modo sandbox de SES): mientras SES esté en modo pruebas,
// tanto el remitente como el destinatario deben estar verificados en la
// consola de SES, o el envío será rechazado con un error de tipo
// "Email address is not verified".

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from 'dotenv';

config({ path: '.env.ses' });

const REGION = 'us-east-2';
const REMITENTE = process.env.SES_VERIFIED_EMAIL;
const destinatario = process.argv[2];

if (!destinatario) {
  console.error('Uso: node test-ses-local.mjs destinatario@ejemplo.com');
  process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !REMITENTE) {
  console.error('Faltan variables en .env.ses (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, SES_VERIFIED_EMAIL).');
  process.exit(1);
}

const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const command = new SendEmailCommand({
  Source: REMITENTE,
  Destination: { ToAddresses: [destinatario] },
  Message: {
    Subject: { Data: 'Confirmación de registro — TaskFlow (prueba local)' },
    Body: {
      Text: {
        Data: `¡Bienvenido a TaskFlow!\n\nEste es un correo de PRUEBA enviado directamente vía AWS SES, sin pasar por Firebase Functions.\n\nDestinatario: ${destinatario}`,
      },
      Html: {
        Data: `<h2>¡Bienvenido a TaskFlow!</h2><p>Este es un correo de <strong>prueba</strong> enviado directamente vía AWS SES.</p><p>Destinatario: <strong>${destinatario}</strong></p>`,
      },
    },
  },
});

try {
  console.log(`Enviando correo de prueba a ${destinatario}...`);
  const result = await sesClient.send(command);
  console.log('✅ Correo enviado correctamente.');
  console.log('MessageId:', result.MessageId);
} catch (error) {
  console.error('❌ Error al enviar el correo:', error.message);
  if (error.name === 'MessageRejected') {
    console.error('Sugerencia: en modo sandbox, verifica también el correo destinatario en la consola de SES.');
  }
  process.exit(1);
}
