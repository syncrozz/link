import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

function loadFirebaseConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse firebase-applet-config.json:', e);
    }
  }

  // Fallback to environment variables if present, otherwise default to configured values
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'syncrozz-platform',
    appId: process.env.FIREBASE_APP_ID || '1:165207391688:web:e33d816413e8a927c4d4fd',
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAILrcL4QlS-EwpitezwRKzxq9dK7B_Wvw',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'syncrozz-platform.firebaseapp.com',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'syncrozz-platform.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '165207391688',
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    const config = loadFirebaseConfig();
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp({
        projectId: config.projectId,
        appId: config.appId,
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
      });
    }
  }
  return firebaseApp;
}

export function getDb(): Firestore {
  if (!firestoreDb) {
    const app = getFirebaseApp();
    const config = loadFirebaseConfig();
    const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? config.firestoreDatabaseId
      : undefined;

    if (databaseId) {
      firestoreDb = getFirestore(app, databaseId);
    } else {
      firestoreDb = getFirestore(app);
    }
  }
  return firestoreDb;
}
