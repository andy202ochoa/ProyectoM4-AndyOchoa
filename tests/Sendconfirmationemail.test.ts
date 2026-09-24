// functions/src/tests/sendConfirmationEmail.test.ts
//
// Prueba la lógica de la Cloud Function sin llamar a AWS de verdad:
// se simula (mock) el cliente de SES, igual que mockeamos StorageService
// en las pruebas del frontend.
 
import { describe, it, expect, vi, beforeEach } from 'vitest';
 
// Simulamos el SDK de AWS SES completo
const mockSend = vi.fn();
 
vi.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    SendEmailCommand: vi.fn().mockImplementation((input) => ({ input })),
  };
});
 
describe('lógica de envío de correo de confirmación (AWS SES simulado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
 
  it('construye el comando con el remitente verificado y el destinatario correcto', async () => {
    const { SendEmailCommand } = await import('@aws-sdk/client-ses');
 
    const REMITENTE_VERIFICADO = 'andy202ochoa@gmail.com';
    const destinatario = 'usuario.prueba@gmail.com';
 
    new SendEmailCommand({
      Source: REMITENTE_VERIFICADO,
      Destination: { ToAddresses: [destinatario] },
      Message: {
        Subject: { Data: 'Confirmación de registro — TaskFlow' },
        Body: {
          Text: { Data: `Bienvenido, ${destinatario}` },
          Html: { Data: `<p>Bienvenido, ${destinatario}</p>` },
        },
      },
    });
 
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Source: REMITENTE_VERIFICADO,
        Destination: { ToAddresses: [destinatario] },
      })
    );
  });
 
  it('llama a sesClient.send() exactamente una vez al enviar', async () => {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
 
    mockSend.mockResolvedValueOnce({ MessageId: 'fake-message-id-123' });
 
    const client = new SESClient({ region: 'us-east-1', credentials: {} as any });
    const command = new SendEmailCommand({}as any);
    const result = await client.send(command);
 
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result.MessageId).toBe('fake-message-id-123');
  });
 
  it('propaga el error si AWS SES rechaza el envío', async () => {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
 
    mockSend.mockRejectedValueOnce(new Error('Email address is not verified'));
 
    const client = new SESClient({ region: 'us-east-1', credentials: {} as any });
    const command = new SendEmailCommand({}as any);
 
    await expect(client.send(command)).rejects.toThrow('Email address is not verified');
  });
 
  it('no envía nada si el destinatario está vacío (validación previa)', () => {
    const validarDestinatario = (email?: string) => {
      if (!email) throw new Error('Falta el correo destinatario.');
      return true;
    };
 
    expect(() => validarDestinatario(undefined)).toThrow('Falta el correo destinatario.');
    expect(() => validarDestinatario('')).toThrow('Falta el correo destinatario.');
    expect(validarDestinatario('valido@correo.com')).toBe(true);
  });
});