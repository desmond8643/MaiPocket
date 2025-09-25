   // hooks/useUserAgent.ts
   import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';

   export const useUserAgent = () => {
     const [userAgent, setUserAgent] = useState("Mozilla/5.0");  // Default fallback

     useEffect(() => {
       const getUA = async () => {
         try {
           const ua = await DeviceInfo.getUserAgent();
           if (ua) setUserAgent(ua);
         } catch (error) {
           console.error("Error getting user agent:", error);
         }
       };

       getUA();
     }, []);

     return userAgent;
   };