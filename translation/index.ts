import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Import translations
import en from './en';
import ja from './ja';

// Create i18n instance
const i18n = new I18n({
  en,
  ja,
});

// Set the locale once at the beginning
i18n.locale = getLocales()[0].languageCode || 'en';

// When a value is missing from a language it'll fall back to another language with the key present
i18n.enableFallback = true;

export default i18n;