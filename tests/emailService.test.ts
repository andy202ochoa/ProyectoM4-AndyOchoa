// Prueba el servicio que pide a la función de Vercel enviar el resumen con
// AWS SES, simulando fetch (sin llamadas de red reales).
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { User } from 'firebase/auth';
import { sendTaskSummaryEmail } from '../src/services/emailService';

const fakeUser = {
  getIdToken: vi.fn().mockResolvedValue('token-de-prueba'),
} as unknown as User;

const summary = { subject: 'Resumen de tareas — 50% completado', text: 'Completadas: 1' };

describe('sendTaskSummaryEmail (AWS SES vía Vercel)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('envía el resumen y el token a /api/send-summary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await sendTaskSummaryEmail(fakeUser, summary);

    expect(fetchMock).toHaveBeenCalledWith('/api/send-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-de-prueba',
      },
      body: JSON.stringify(summary),
    });
  });

  it('lanza el motivo del error si SES rechaza el envío', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ error: 'No se pudo enviar', detail: 'Email address is not verified' }),
    }));

    await expect(sendTaskSummaryEmail(fakeUser, summary)).rejects.toThrow('Email address is not verified');
  });
});
