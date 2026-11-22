// Utilidad compartida por las funciones de /api (Vercel no convierte en
// endpoint los archivos dentro de carpetas que empiezan con "_").

export interface FirebaseUser {
  email: string;
  emailVerified: boolean;
}

/**
 * Valida el token de sesión de Firebase contra la API REST oficial y devuelve
 * el correo del usuario. Devuelve null si el token es inválido o venció.
 * Así el correo de destino lo decide Firebase, no el cliente.
 */
export async function getUserFromToken(idToken: string, apiKey: string): Promise<FirebaseUser | null> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { users?: { email?: string; emailVerified?: boolean }[] };
  const user = data.users?.[0];
  if (!user?.email) return null;
  return { email: user.email, emailVerified: Boolean(user.emailVerified) };
}

/** Extrae el token de la cabecera "Authorization: Bearer <token>" */
export function getBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
}
