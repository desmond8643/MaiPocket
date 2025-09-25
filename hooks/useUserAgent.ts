   // hooks/useUserAgent.ts
   import { useState, useEffect } from 'react';
   import DeviceInfo from 'react-native-device-info';

   export const useUserAgent = () => {
     const [userAgent, setUserAgent] = useState("");

     useEffect(() => {
       DeviceInfo.getUserAgent().then(userAgent => {
         setUserAgent(userAgent);
       });
     }, []);

     return userAgent;
   }