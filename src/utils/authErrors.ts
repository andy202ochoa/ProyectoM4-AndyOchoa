/**
 * Traduce los códigos de error de Firebase Auth a mensajes claros en español.
 *
 * Nota: Firebase tiene activada la "protección contra la enumeración de correos",
 * por eso un correo inexistente y una contraseña incorrecta llegan con el mismo
 * código (auth/invalid-credential). Así nadie puede averiguar qué correos
 * están registrados.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Login
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada. Contacta al soporte.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.',

  // Registro
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo. Inicia sesión.',
  'auth/weak-password': 'La contraseña es muy débil: debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/missing-password': 'Escribe una contraseña.',

  // Google
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
  'auth/cancelled-popup-request': 'Se canceló el inicio con Google.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.',
  'auth/account-exists-with-different-credential':
    'Este correo ya está registrado con otro método. Inicia sesión con correo y contraseña.',
  'auth/unauthorized-domain': 'Este sitio no está autorizado para iniciar sesión con Google.',

  // Generales
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/operation-not-allowed': 'Este método de inicio de sesión no está habilitado.',
  'auth/internal-error': 'Ocurrió un error en el servidor. Inténtalo de nuevo.',
};

export const DEFAULT_AUTH_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

/** Devuelve un mensaje comprensible a partir de un error de Firebase Auth */
export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    return AUTH_ERROR_MESSAGES[code] ?? DEFAULT_AUTH_ERROR;
  }
  return DEFAULT_AUTH_ERROR;
}

/** Validaciones antes de llamar a Firebase. Devuelve el mensaje de error o null si todo está bien. */
export function validateAuthForm(email: string, password: string, mode: 'login' | 'register'): string | null {
  if (!email && !password) return 'Escribe tu correo y tu contraseña.';
  if (!email) return 'Escribe tu correo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El correo no tiene un formato válido.';
  if (!password) return 'Escribe tu contraseña.';
  if (mode === 'register' && password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  return null;
}
