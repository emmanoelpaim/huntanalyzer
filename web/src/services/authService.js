import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

const provider = new GoogleAuthProvider();

export async function fazerLoginGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return {
      id: result.user.uid,
      email: result.user.email,
      name: result.user.displayName,
      picture: result.user.photoURL
    };
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

export async function fazerLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro no logout:', error);
    throw error;
  }
}

export function obterUsuarioAtual() {
  return auth.currentUser;
}

export function verificarSessaoAtiva(callback) {
  return onAuthStateChanged(auth, callback);
}
