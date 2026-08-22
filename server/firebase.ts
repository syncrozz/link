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

  // Fallback to environment variables if present
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'subtle-furnace-sc9s2',
    appId: process.env.FIREBASE_APP_ID || '',
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || 'ai-studio-syncrozzlink-3409d9f0-66e7-4814-9e4e-847018e57c83',
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
