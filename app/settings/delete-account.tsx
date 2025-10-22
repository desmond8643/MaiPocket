import { AuthAPI } from '@/api/client';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const validateConfirmPassword = (value: string) => {
    // Clear previous errors
    setConfirmPasswordError('');
    
    // Check if passwords match
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleDeleteAccount = async () => {
    // Validate inputs
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isConfirmPasswordValid) {
      return;
    }
    
    // Show a final confirmation alert
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };
  
  const performDelete = async () => {
    setLoading(true);
    
    try {
      await AuthAPI.deleteAccount(password);
      
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Delete account error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      
      // Check for incorrect password error
      if (errorMessage.includes('Password is incorrect')) {
        setPasswordError('Password is incorrect');
      } else {
        Alert.alert('Error', errorMessage);
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
          <ThemedText style={styles.title}>Delete Account</ThemedText>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.warningText}>
            Warning: This action is permanent and cannot be undone. All your data will be permanently deleted.
          </ThemedText>
          
          {/* Password */}
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
              placeholder="Enter your password"
              placeholderTextColor={iconColor}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
          ) : (
            <ThemedText style={styles.helperText}>
              Enter your current password for verification
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
              placeholder="Confirm your password"
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
              Re-enter your password to confirm
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!password || !confirmPassword || 
               !!passwordError || !!confirmPasswordError) 
               ? styles.disabledButton : {}
            ]}
            onPress={handleDeleteAccount}
            disabled={loading || !password || !confirmPassword || 
                     !!passwordError || !!confirmPasswordError}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.deleteButtonText}>
                Delete My Account
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
  warningText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 24,
    lineHeight: 22,
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
  deleteButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#FFB5B5',
    opacity: 0.7,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
