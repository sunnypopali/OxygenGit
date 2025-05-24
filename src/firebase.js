import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyByRbmzEyFmIonZpfNucNk1_KWBLnxdbRA",
  authDomain: "oxygen-6ed11.firebaseapp.com",
  projectId: "oxygen-6ed11",
  storageBucket: "oxygen-6ed11.firebasestorage.app",
  messagingSenderId: "643311793826",
  appId: "1:643311793826:web:2672eaa160b4f709c309fb",
  measurementId: "G-V9WLY4FNQV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);