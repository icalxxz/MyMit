// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const env = (name) => import.meta.env[name]?.trim();

// Nilai ini dibaca Vite dari .env saat aplikasi dibangun/dijalankan.
const firebaseConfig = {
    apiKey: env('VITE_FIREBASE_API_KEY'),
    authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: env('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('VITE_FIREBASE_APP_ID'),
    databaseURL: env('VITE_FIREBASE_DATABASE_URL')
};

// Hanya izinkan path relatif RTDB: tanpa slash di awal/akhir. Bila tidak
// diatur, baca root RTDB agar impor data.json secara langsung tetap terbaca.
export const sensorPath = env('VITE_FIREBASE_RTDB_PATH')
    ?.replace(/^\/+|\/+$/g, '') ?? '';

// Firebase is optional for local builds that use the bundled data.json.
export const hasFirebaseConfig = Boolean(
    firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.appId
);

export const rtdb = hasFirebaseConfig
    ? getDatabase(initializeApp(firebaseConfig))
    : null;
