import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage, validateAuthForm, DEFAULT_AUTH_ERROR } from '../src/utils/authErrors';

describe('getAuthErrorMessage', () => {
  it('traduce credenciales incorrectas a un mensaje claro', () => {
    expect(getAuthErrorMessage({ code: 'auth/invalid-credential' })).toBe('Correo o contraseña incorrectos.');
  });

  it('avisa cuando el correo ya está registrado', () => {
    expect(getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'Ya existe una cuenta con este correo. Inicia sesión.'
    );
  });

  it('avisa de demasiados intentos y de problemas de red', () => {
    expect(getAuthErrorMessage({ code: 'auth/too-many-requests' })).toContain('Demasiados intentos');
    expect(getAuthErrorMessage({ code: 'auth/network-request-failed' })).toContain('Sin conexión');
  });

  it('caso borde: código desconocido o error sin código usa el mensaje genérico', () => {
    expect(getAuthErrorMessage({ code: 'auth/codigo-inventado' })).toBe(DEFAULT_AUTH_ERROR);
    expect(getAuthErrorMessage(new Error('fallo'))).toBe(DEFAULT_AUTH_ERROR);
    expect(getAuthErrorMessage(null)).toBe(DEFAULT_AUTH_ERROR);
  });
});

describe('validateAuthForm', () => {
  it('pide los datos que faltan', () => {
    expect(validateAuthForm('', '', 'login')).toBe('Escribe tu correo y tu contraseña.');
    expect(validateAuthForm('', 'secreto', 'login')).toBe('Escribe tu correo.');
    expect(validateAuthForm('ana@mail.com', '', 'login')).toBe('Escribe tu contraseña.');
  });

  it('rechaza correos con formato inválido', () => {
    expect(validateAuthForm('ana@mail', '123456', 'login')).toBe('El correo no tiene un formato válido.');
  });

  it('en el registro exige mínimo 6 caracteres de contraseña', () => {
    expect(validateAuthForm('ana@mail.com', '123', 'register')).toBe(
      'La contraseña debe tener al menos 6 caracteres.'
    );
    expect(validateAuthForm('ana@mail.com', '123', 'login')).toBeNull();
  });

  it('devuelve null cuando los datos son válidos', () => {
    expect(validateAuthForm('ana@mail.com', '123456', 'register')).toBeNull();
  });
});
