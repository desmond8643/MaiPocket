import { AuthAPI } from '@/api/client';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalization } from '@/context/LocalizationContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const isLoggedIn = await AuthAPI.isLoggedIn();
      if (!isLoggedIn) {
        Alert.alert(t('error'), t('mustBeLoggedIn'));
        router.replace('/auth/login');
        return;
      }

      const userData = await AuthAPI.getCurrentUser();
      setUsername(userData.username);
      setOriginalUsername(userData.username);
      setDisplayName(userData.displayName);
      setOriginalDisplayName(userData.displayName);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(t('error'), t('failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (value: string) => {
    // Clear previous errors
    setUsernameError('');
    
    // Username length between 3 and 20 characters
    if (value.length < 3 || value.length > 20) {
      setUsernameError(t('usernameLengthError'));
      return false;
    }
    
    // Only allow letters, numbers, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError(t('usernameCharactersError'));
      return false;
    }
    
    return true;
  };

  const validateDisplayName = (value: string) => {
    // Clear previous errors
    setDisplayNameError('');
    
    // Display name length between 1 and 30 characters
    if (value.length < 1 || value.length > 30) {
      setDisplayNameError(t('displayNameLengthError'));
      return false;
    }
    
    // Filter out offensive words or patterns if needed
    const offensiveWords = ['admin', 'moderator', 'official']; // Example list
    if (offensiveWords.some(word => value.toLowerCase().includes(word))) {
      setDisplayNameError(t('displayNameReservedError'));
      return false;
    }
    
    return true;
  };

  const handleSaveChanges = async () => {
    // Validate inputs
    const isUsernameValid = validateUsername(username);
    const isDisplayNameValid = validateDisplayName(displayName);
    
    if (!isUsernameValid || !isDisplayNameValid) {
      return;
    }
    
    setUpdating(true);
    
    try {
      // Only update if values have changed
      if (username === originalUsername && displayName === originalDisplayName) {
        Alert.alert(t('info'), t('noProfileChanges'));
        router.back();
        return;
      }
      
      const updatedData = await AuthAPI.updateProfile({
        username,
        displayName,
      });
      
      // Update local storage with new user data
      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      
      Alert.alert(
        t('success'),
        t('profileUpdatedSuccess'),
        [
          {
            text: t('ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || t('failedToUpdateProfile');
      
      // Check for duplicate username error
      if (errorMessage.includes('username already exists')) {
        setUsernameError(t('usernameAlreadyTaken'));
      } else {
        Alert.alert(t('error'), errorMessage);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AE75DA" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#AE75DA" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{t('editProfile')}</ThemedText>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.sectionTitle}>{t('accountInformation')}</ThemedText>
          
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={{
                flex: 1,
                height: 50,
                color: textColor,
                fontSize: 16,
              }}
              placeholder={t('username')}
              placeholderTextColor={iconColor}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                validateUsername(text);
              }}
              autoCapitalize="none"
            />
          </View>
          {usernameError ? (
            <ThemedText style={styles.errorText}>{usernameError}</ThemedText>
          ) : (
            <ThemedText style={styles.helperText}>
              {t('usernameHelperText')}
            </ThemedText>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-circle-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={{
                flex: 1,
                height: 50,
                color: textColor,
                fontSize: 16,
              }}
              placeholder={t('displayName')}
              placeholderTextColor={iconColor}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                validateDisplayName(text);
              }}
            />
          </View>
          {displayNameError ? (
            <ThemedText style={styles.errorText}>{displayNameError}</ThemedText>
          ) : (
            <ThemedText style={styles.helperText}>
              {t('displayNameHelperText')}
            </ThemedText>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveChanges}
            disabled={updating || !!usernameError || !!displayNameError}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>
                {t('saveChanges')}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#AE75DA',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 