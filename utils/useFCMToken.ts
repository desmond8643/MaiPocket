// utils/fcmToken.ts or hooks/useFCMToken.ts
import { useEffect, useState } from 'react';
import { getMessaging, getToken, onTokenRefresh, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';

export async function getFCMToken(): Promise<string | null> {
  try {
    const app = getApp();
    const messaging = getMessaging(app);
    
    // Request permission (iOS)
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('User permission not granted');
      return null;
    }

    // Get the token
    const token = await getToken(messaging);
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

    // Listen for token refresh using modular API
    const app = getApp();
    const messaging = getMessaging(app);
    
    const unsubscribe = onTokenRefresh(messaging, (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      setToken(newToken);
      // Send new token to your backend
      // updateTokenOnBackend(newToken);
    });

    return () => unsubscribe();
  }, []);

  return { token, loading };
}