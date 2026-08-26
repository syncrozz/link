import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyDf_pqCAHfWSS2vvzpXYVHMlFbKuBpWKBk",
  authDomain: "gen-lang-client-0739778545.firebaseapp.com",
  projectId: "gen-lang-client-0739778545",
  storageBucket: "gen-lang-client-0739778545.firebasestorage.app",
  messagingSenderId: "592122598840",
  appId: "1:592122598840:web:8877fee7a78426ac1feb4d",
  measurementId: ""
};

// Initialize Firebase
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let analytics: Analytics | null = null;

// Initialize Analytics asynchronously when supported in browser environment
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

export { analytics };
