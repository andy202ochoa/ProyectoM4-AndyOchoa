import { auth } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { sendVerification } from "./emailVerification";

export const login = async (email: string, password: string): Promise<UserCredential> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Si inicia sesión sin haber verificado su correo, le reenviamos el enlace.
  // Un fallo aquí no debe impedir el inicio de sesión.
  if (!credential.user.emailVerified) {
    await sendVerification(credential.user).catch((error) =>
      console.warn("No se pudo reenviar la verificación:", error)
    );
  }

  return credential;
};

export const register = async (email: string, password: string): Promise<UserCredential> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Correo de verificación con AWS SES.
  // Si falla, la cuenta igual queda creada y puede reenviarlo luego.
  await sendVerification(credential.user).catch((error) =>
    console.warn("No se pudo enviar la verificación:", error)
  );
  return credential;
};

export const loginWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};