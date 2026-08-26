import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
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

  // Fallback to environment variables if present, otherwise default to configured provisioned values
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0739778545',
    appId: process.env.FIREBASE_APP_ID || '1:592122598840:web:8877fee7a78426ac1feb4d',
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDf_pqCAHfWSS2vvzpXYVHMlFbKuBpWKBk',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0739778545.firebaseapp.com',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || 'ai-studio-link-ab67e208-5996-4549-abf2-eea242c083d8',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0739778545.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '592122598840',
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
