import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDs3zSMN92LAaiAVVEfoTD08Mz3v5Jmf7A",
  authDomain: "lootanalyzer.firebaseapp.com",
  projectId: "lootanalyzer",
  storageBucket: "lootanalyzer.firebasestorage.app",
  messagingSenderId: "30757447698",
  appId: "1:30757447698:web:f9008541cb9f5d93bd10cb",
  measurementId: "G-BMB3MDZG9D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
