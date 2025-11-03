import { AuthAPI } from '@/api/client';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalization } from '@/context/LocalizationContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const validateNewPassword = (value: string) => {
    // Clear previous errors
    setNewPasswordError('');
    
    // Password length at least 8 characters
    if (value.length < 8) {
      setNewPasswordError(t('passwordLengthError'));
      return false;
    }
    
    return true;
  };

  const validateConfirmPassword = (value: string) => {
    // Clear previous errors
    setConfirmPasswordError('');
    
    // Check if passwords match
    if (value !== newPassword) {
      setConfirmPasswordError(t('passwordsDoNotMatch'));
      return false;
    }
    
    return true;
  };

  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword) {
      setCurrentPasswordError(t('currentPasswordRequired'));
      return;
    }
    
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      await AuthAPI.changePassword({
        currentPassword,
        newPassword,
      });
      
      Alert.alert(
        t('success'),
        t('passwordChangedSuccess'),
        [
          {
            text: t('ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || t('failedToChangePassword');
      
      // Check for incorrect current password error
      if (errorMessage.includes('current password is incorrect')) {
        setCurrentPasswordError(t('currentPasswordIncorrect'));
      } else {
        Alert.alert(t('error'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
          <ThemedText style={styles.title}>{t('changePassword')}</ThemedText>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.sectionTitle}>{t('updateYourPassword')}</ThemedText>
          
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
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
              placeholder={t('currentPassword')}
              placeholderTextColor={iconColor}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setCurrentPasswordError('');
              }}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {currentPasswordError ? (
            <ThemedText style={styles.errorText}>{currentPasswordError}</ThemedText>
          ) : (
            <ThemedText style={styles.helperText}>
              {t('currentPasswordHelperText')}
            </ThemedText>
          )}

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-open-outline"
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
              placeholder={t('newPassword')}
              placeholderTextColor={iconColor}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                validateNewPassword(text);
              }}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {newPasswordError ? (
            <ThemedText style={styles.errorText}>{newPasswordError}</ThemedText>
          ) : (
            <ThemedText style={styles.helperText}>
              {t('passwordLengthHelperText')}
            </ThemedText>
          )}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
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
              placeholder={t('confirmNewPassword')}
              placeholderTextColor={iconColor}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                validateConfirmPassword(text);
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <ThemedText style={styles.errorText}>{confirmPasswordError}</ThemedText>
          ) : (
            <ThemedText style={styles.helperText}>
              {t('confirmPasswordHelperText')}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!currentPassword || !newPassword || !confirmPassword || 
               !!currentPasswordError || !!newPasswordError || !!confirmPasswordError) 
               ? styles.disabledButton : {}
            ]}
            onPress={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword || 
                     !!currentPasswordError || !!newPasswordError || !!confirmPasswordError}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>
                {t('changePassword')}
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
  eyeIcon: {
    padding: 8,
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
  disabledButton: {
    backgroundColor: '#D0B7E6',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 