import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
<<<<<<< HEAD
  apiKey: "AIzaSyDf_pqCAHfWSS2vvzpXYVHMlFbKuBpWKBk",
  authDomain: "gen-lang-client-0739778545.firebaseapp.com",
  projectId: "gen-lang-client-0739778545",
  storageBucket: "gen-lang-client-0739778545.firebasestorage.app",
  messagingSenderId: "592122598840",
  appId: "1:592122598840:web:8877fee7a78426ac1feb4d",
  measurementId: ""
=======
  apiKey: "AIzaSyAILrcL4QlS-EwpitezwRKzxq9dK7B_Wvw",
  authDomain: "syncrozz-platform.firebaseapp.com",
  projectId: "syncrozz-platform",
  storageBucket: "syncrozz-platform.firebasestorage.app",
  messagingSenderId: "165207391688",
  appId: "1:165207391688:web:e33d816413e8a927c4d4fd",
  measurementId: "G-L8TM5MX4YD"
>>>>>>> ab995edd66f75a6f750643ae943eff05a985036f
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
