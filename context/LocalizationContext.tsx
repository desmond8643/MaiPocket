import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect } from "react";
import { getLocales } from "expo-localization";
import i18n from "@/translation";

const LANGUAGE_STORAGE_KEY = "app_language";

type LocalizationContextType = {
  t: (key: string, options?: any) => string;
  locale: string;
  setLocale: (locale: string) => void;
};

const LocalizationContext = createContext<LocalizationContextType>({
  t: (key) => key,
  locale: "en",
  setLocale: () => {},
});

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<string>("en"); // Default to English
  const [isLoading, setIsLoading] = useState(true);

  // Function to validate language code
  const isValidLanguage = (code: string): boolean => {
    return ["en", "ja"].includes(code);
  };

  useEffect(() => {
    // Load saved language preference
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (savedLanguage && isValidLanguage(savedLanguage)) {
          // Use saved language if it exists and is valid
          setLocaleState(savedLanguage);
          i18n.locale = savedLanguage;
        } else {
          // Otherwise try to use device language
          const deviceLanguage = getLocales()[0]?.languageCode || "en";
          const languageToUse = isValidLanguage(deviceLanguage)
            ? deviceLanguage
            : "en";
          setLocaleState(languageToUse);
          i18n.locale = languageToUse;

          // Save the detected language for next time
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageToUse);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
        // Default to English if there's an error
        setLocaleState("en");
        i18n.locale = "en";
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  // Update language and save preference
  const setLocale = async (newLocale: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
      setLocaleState(newLocale);
      i18n.locale = newLocale;
    } catch (error) {
      console.error("Error saving language preference:", error);
    }
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  if (isLoading) {
    // You could return a loading indicator here if needed
    return null;
  }

  return (
    <LocalizationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);
