import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';

// Firebase client configuration
// Users can provide these in .env or defaults will activate mock fallback for local testing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderKeyForLocalTesting123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trustguard-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trustguard-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'trustguard-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

// Initialize Firebase App singleton safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom Google Sign-In helper that gracefully falls back to interactive simulated sign-in
// if Firebase keys are not yet configured or user is in offline development
export async function signInWithGooglePopup(): Promise<{ email: string; displayName: string; idToken?: string }> {
  try {
    // If real keys are present, attempt genuine popup
    if (
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_API_KEY !== 'AIzaSyDemoPlaceholderKeyForLocalTesting123'
    ) {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      return {
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
        idToken,
      };
    } else {
      // Graceful fallback for test/dev environment without active Firebase console setup:
      // Prompt user or use default Google identity
      const simulatedEmail = window.prompt(
        'Enter Google account email to continue with Google (Firebase dev mode):',
        'namitha.google@example.com'
      );
      if (!simulatedEmail) {
        throw new Error('Google Sign-In was cancelled.');
      }
      return {
        email: simulatedEmail.trim(),
        displayName: simulatedEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        idToken: 'simulated_firebase_token_' + Date.now(),
      };
    }
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    // If popup blocked or invalid key, offer fallback prompt so testing is never blocked
    if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      const simulatedEmail = window.prompt(
        'Firebase configuration not active yet. Enter email to test Google login:',
        'namitha.google@example.com'
      );
      if (simulatedEmail) {
        return {
          email: simulatedEmail.trim(),
          displayName: simulatedEmail.split('@')[0].replace('.', ' ').toUpperCase(),
          idToken: 'simulated_firebase_token_' + Date.now(),
        };
      }
    }
    throw error;
  }
}

