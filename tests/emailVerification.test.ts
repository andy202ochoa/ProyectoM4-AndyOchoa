// Prueba la lógica de envío de verificación: primero AWS SES (vía la
// función de Vercel) y, si falla, el envío de Firebase como respaldo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from 'firebase/auth';

const mockSendEmailVerification = vi.fn();

vi.mock('firebase/auth', () => ({
  sendEmailVerification: (...args: unknown[]) => mockSendEmailVerification(...args),
}));

import { sendVerification } from '../src/services/emailVerification';

const fakeUser = {
  getIdToken: vi.fn().mockResolvedValue('token-de-prueba'),
} as unknown as User;

describe('sendVerification (AWS SES con respaldo de Firebase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa AWS SES cuando la función responde bien', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const channel = await sendVerification(fakeUser);

    expect(channel).toBe('ses');
    expect(fetchMock).toHaveBeenCalledWith('/api/send-verification', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-de-prueba' },
    });
    expect(mockSendEmailVerification).not.toHaveBeenCalled();
  });

  it('usa Firebase como respaldo si SES responde con error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    const channel = await sendVerification(fakeUser);

    expect(channel).toBe('firebase');
    expect(mockSendEmailVerification).toHaveBeenCalledWith(fakeUser);
  });

  it('usa Firebase como respaldo si no hay conexión con la función', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));

    const channel = await sendVerification(fakeUser);

    expect(channel).toBe('firebase');
    expect(mockSendEmailVerification).toHaveBeenCalledTimes(1);
  });
});
