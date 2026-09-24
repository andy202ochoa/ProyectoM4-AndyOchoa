import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Los secretos se leen del almacén seguro configurado con
// `firebase functions:secrets:set`, nunca quedan escritos en el código
const AWS_ACCESS_KEY_ID = defineSecret('AWS_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = defineSecret('AWS_SECRET_ACCESS_KEY');

// Debe ser exactamente el correo que verificaste en SES (Paso "Verificar
// dirección de correo electrónico" de la consola)
const REMITENTE_VERIFICADO = 'andy202ochoa@gmail.com';

export const sendConfirmationEmail = onCall(
  { secrets: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY], region: 'us-east-2' },
  async (request) => {
    // Solo usuarios autenticados pueden disparar el envío
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para esta acción.');
    }

    const destinatario = request.data?.email as string | undefined;
    if (!destinatario) {
      throw new HttpsError('invalid-argument', 'Falta el correo destinatario.');
    }

    const sesClient = new SESClient({
      region: 'us-east-2',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID.value(),
        secretAccessKey: AWS_SECRET_ACCESS_KEY.value(),
      },
    });

    const command = new SendEmailCommand({
      Source: REMITENTE_VERIFICADO,
      Destination: { ToAddresses: [destinatario] },
      Message: {
        Subject: { Data: 'Confirmación de registro — TaskFlow' },
        Body: {
          Text: {
            Data: `¡Bienvenido a TaskFlow!\n\nTu cuenta se registró correctamente con el correo ${destinatario}.`,
          },
          Html: {
            Data: `<h2>¡Bienvenido a TaskFlow!</h2><p>Tu cuenta se registró correctamente con el correo <strong>${destinatario}</strong>.</p>`,
          },
        },
      },
    });

    try {
      const result = await sesClient.send(command);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      console.error('Error enviando correo con SES:', error);
      throw new HttpsError('internal', 'No se pudo enviar el correo de confirmación.');
    }
  }
);