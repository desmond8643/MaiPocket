// import AsyncStorage from '@react-native-async-storage/async-storage';
// import React, { createContext, useContext, useEffect, useState } from 'react';

// interface AdContextType {
//   adsRemoved: boolean;
//   temporaryAdRemoval: boolean;
//   temporaryAdRemovalEndTime: number | null;
//   removeAdsTemporarily: () => Promise<void>;
//   removeAdsPermanently: () => Promise<void>;
//   restorePurchases: () => Promise<boolean>;
//   checkAdStatus: () => Promise<void>;
// }

// const AdContext = createContext<AdContextType | undefined>(undefined);

// const AD_STORAGE_KEY = 'ad_removal_status';

// export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [adsRemoved, setAdsRemoved] = useState(false);
//   const [temporaryAdRemoval, setTemporaryAdRemoval] = useState(false);
//   const [temporaryAdRemovalEndTime, setTemporaryAdRemovalEndTime] = useState<number | null>(null);

//   // Check ad status on app load
//   useEffect(() => {
//     checkAdStatus();
//   }, []);

//   const checkAdStatus = async () => {
//     try {
//       const adStatus = await AsyncStorage.getItem(AD_STORAGE_KEY);
      
//       if (adStatus) {
//         const parsedStatus = JSON.parse(adStatus);
        
//         if (parsedStatus.permanent) {
//           setAdsRemoved(true);
//           setTemporaryAdRemoval(false);
//           setTemporaryAdRemovalEndTime(null);
//         } else if (parsedStatus.temporary && parsedStatus.endTime > Date.now()) {
//           // Temporary removal is still valid
//           setTemporaryAdRemoval(true);
//           setTemporaryAdRemovalEndTime(parsedStatus.endTime);
//           setAdsRemoved(false);
//         } else {
//           // Temporary removal has expired
//           setAdsRemoved(false);
//           setTemporaryAdRemoval(false);
//           setTemporaryAdRemovalEndTime(null);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load ad removal status:', error);
//     }
//   };

//   const removeAdsTemporarily = async () => {
//     const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
//     const endTime = Date.now() + oneDayInMs;
    
//     try {
//       await AsyncStorage.setItem(
//         AD_STORAGE_KEY, 
//         JSON.stringify({
//           temporary: true,
//           permanent: false,
//           endTime
//         })
//       );
      
//       setTemporaryAdRemoval(true);
//       setTemporaryAdRemovalEndTime(endTime);
//       setAdsRemoved(false);
//     } catch (error) {
//       console.error('Failed to save temporary ad removal:', error);
//     }
//   };

//   const removeAdsPermanently = async () => {
//     try {
//       await AsyncStorage.setItem(
//         AD_STORAGE_KEY,
//         JSON.stringify({
//           temporary: false,
//           permanent: true,
//           endTime: null
//         })
//       );
      
//       setAdsRemoved(true);
//       setTemporaryAdRemoval(false);
//       setTemporaryAdRemovalEndTime(null);
//     } catch (error) {
//       console.error('Failed to save permanent ad removal:', error);
//     }
//   };

//   const restorePurchases = async () => {
//     // This would integrate with your IAP system
//     // For now, we'll just check local storage
//     try {
//       const adStatus = await AsyncStorage.getItem(AD_STORAGE_KEY);
//       if (adStatus) {
//         const parsedStatus = JSON.parse(adStatus);
//         if (parsedStatus.permanent) {
//           setAdsRemoved(true);
//           return true;
//         }
//       }
//       return false;
//     } catch (error) {
//       console.error('Failed to restore purchases:', error);
//       return false;
//     }
//   };

//   return (
//     <AdContext.Provider
//       value={{
//         adsRemoved,
//         temporaryAdRemoval,
//         temporaryAdRemovalEndTime,
//         removeAdsTemporarily,
//         removeAdsPermanently,
//         restorePurchases,
//         checkAdStatus
//       }}
//     >
//       {children}
//     </AdContext.Provider>
//   );
// };

// export const useAds = () => {
//   const context = useContext(AdContext);
//   if (context === undefined) {
//     throw new Error('useAds must be used within an AdProvider');
//   }
//   return context;
// }; 
// context/AdContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SHOW_ADS } from '@/constants/adsConfig';

interface AdContextType {
  adsRemoved: boolean;
  temporaryAdRemoval: boolean;
  temporaryAdRemovalEndTime: number | null;
  removeAdsTemporarily: () => Promise<void>;
  removeAdsPermanently: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  checkAdStatus: () => Promise<void>;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const AD_STORAGE_KEY = 'ad_removal_status';

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [temporaryAdRemoval, setTemporaryAdRemoval] = useState(false);
  const [temporaryAdRemovalEndTime, setTemporaryAdRemovalEndTime] = useState<number | null>(null);

  // Check ad status on app load
  useEffect(() => {
    checkAdStatus();
  }, []);

  const checkAdStatus = async () => {
    try {
      // If we're not showing ads due to Expo Go, mark ads as removed
      if (!SHOW_ADS) {
        setAdsRemoved(true);
        return;
      }
      
      const adStatus = await AsyncStorage.getItem(AD_STORAGE_KEY);
      
      if (adStatus) {
        const parsedStatus = JSON.parse(adStatus);
        
        if (parsedStatus.permanent) {
          setAdsRemoved(true);
          setTemporaryAdRemoval(false);
          setTemporaryAdRemovalEndTime(null);
        } else if (parsedStatus.temporary && parsedStatus.endTime > Date.now()) {
          // Temporary removal is still valid
          setTemporaryAdRemoval(true);
          setTemporaryAdRemovalEndTime(parsedStatus.endTime);
          setAdsRemoved(false);
        } else {
          // Temporary removal has expired
          setAdsRemoved(false);
          setTemporaryAdRemoval(false);
          setTemporaryAdRemovalEndTime(null);
        }
      }
    } catch (error) {
      console.error('Failed to load ad removal status:', error);
    }
  };

  // Rest of your functions...
   const removeAdsTemporarily = async () => {
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const endTime = Date.now() + oneDayInMs;
    
    try {
      await AsyncStorage.setItem(
        AD_STORAGE_KEY, 
        JSON.stringify({
          temporary: true,
          permanent: false,
          endTime
        })
      );
      
      setTemporaryAdRemoval(true);
      setTemporaryAdRemovalEndTime(endTime);
      setAdsRemoved(false);
    } catch (error) {
      console.error('Failed to save temporary ad removal:', error);
    }
  };

  const removeAdsPermanently = async () => {
    try {
      await AsyncStorage.setItem(
        AD_STORAGE_KEY,
        JSON.stringify({
          temporary: false,
          permanent: true,
          endTime: null
        })
      );
      
      setAdsRemoved(true);
      setTemporaryAdRemoval(false);
      setTemporaryAdRemovalEndTime(null);
    } catch (error) {
      console.error('Failed to save permanent ad removal:', error);
    }
  };

  const restorePurchases = async () => {
    // This would integrate with your IAP system
    // For now, we'll just check local storage
    try {
      const adStatus = await AsyncStorage.getItem(AD_STORAGE_KEY);
      if (adStatus) {
        const parsedStatus = JSON.parse(adStatus);
        if (parsedStatus.permanent) {
          setAdsRemoved(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  };
  return (
    <AdContext.Provider
      value={{
        adsRemoved: adsRemoved || !SHOW_ADS, // Always treat ads as removed if SHOW_ADS is false
        temporaryAdRemoval,
        temporaryAdRemovalEndTime,
        removeAdsTemporarily,
        removeAdsPermanently,
        restorePurchases,
        checkAdStatus
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdContext);
  if (context === undefined) {
    // Create a mock context instead of throwing an error
    return {
      adsRemoved: true,
      temporaryAdRemoval: false,
      temporaryAdRemovalEndTime: null,
      removeAdsTemporarily: async () => {},
      removeAdsPermanently: async () => {},
      restorePurchases: async () => false,
      checkAdStatus: async () => {}
    };
  }
  return context;
};