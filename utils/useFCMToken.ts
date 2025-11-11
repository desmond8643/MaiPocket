// utils/fcmToken.ts or hooks/useFCMToken.ts
import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';

export async function getFCMToken(): Promise<string | null> {
  try {
    // Request permission (iOS)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('User permission not granted');
      return null;
    }

    // Get the token
    const token = await messaging().getToken();
    console.log('FCM Registration Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Hook version
export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      const fcmToken = await getFCMToken();
      setToken(fcmToken);
      setLoading(false);
    }

    fetchToken();

    // Listen for token refresh
    const unsubscribe = messaging().onTokenRefresh((newToken) => {
      console.log('FCM Token refreshed:', newToken);
      setToken(newToken);
      // Send new token to your backend
      // updateTokenOnBackend(newToken);
    });

    return () => unsubscribe();
  }, []);

  return { token, loading };
}