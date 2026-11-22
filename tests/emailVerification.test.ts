// Prueba el envío del correo de verificación con AWS SES (vía la función
// /api/send-verification de Vercel), sin llamar a la red de verdad.
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { User } from 'firebase/auth';
import { sendVerification } from '../src/services/emailVerification';

const fakeUser = {
  getIdToken: vi.fn().mockResolvedValue('token-de-prueba'),
} as unknown as User;

describe('sendVerification (AWS SES)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('llama a la función de Vercel con el token del usuario', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendVerification(fakeUser)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/send-verification', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-de-prueba' },
    });
  });

  it('lanza un error con el motivo si SES rechaza el envío', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ error: 'No se pudo enviar', detail: 'Email address is not verified' }),
    }));

    await expect(sendVerification(fakeUser)).rejects.toThrow('Email address is not verified');
  });

  it('propaga el error si no hay conexión con la función', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));

    await expect(sendVerification(fakeUser)).rejects.toThrow('sin red');
  });
});
