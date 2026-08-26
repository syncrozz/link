import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyAILrcL4QlS-EwpitezwRKzxq9dK7B_Wvw",
  authDomain: "syncrozz-platform.firebaseapp.com",
  projectId: "syncrozz-platform",
  storageBucket: "syncrozz-platform.firebasestorage.app",
  messagingSenderId: "165207391688",
  appId: "1:165207391688:web:e33d816413e8a927c4d4fd",
  measurementId: "G-L8TM5MX4YD"
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
