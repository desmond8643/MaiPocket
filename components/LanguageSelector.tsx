import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalization } from '@/context/LocalizationContext';
import { ThemedText } from './ThemedText';

export default function LanguageSelector() {
  const { locale, setLocale } = useLocalization();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, locale === 'en' ? styles.active : null]}
        onPress={() => setLocale('en')}
      >
        <ThemedText style={[styles.text, locale === 'en' ? styles.activeText : null]}>
          English
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, locale === 'ja' ? styles.active : null]}
        onPress={() => setLocale('ja')}
      >
        <ThemedText style={[styles.text, locale === 'ja' ? styles.activeText : null]}>
          日本語
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  active: {
    backgroundColor: '#9944DD',
    borderColor: '#9944DD',
  },
  text: {
    fontSize: 16,
  },
  activeText: {
    color: 'white',
  },
});