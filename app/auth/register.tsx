import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI } from "@/api/client";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");

  const validateUsername = (value: string) => {
    // Clear previous errors
    setUsernameError("");
    
    // Username length between 3 and 20 characters
    if (value.length < 3 || value.length > 20) {
      setUsernameError("Username must be between 3 and 20 characters");
      return false;
    }
    
    // Only allow letters, numbers, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError("Username can only contain letters, numbers, underscores, and hyphens");
      return false;
    }
    
    return true;
  };

  const validateDisplayName = (value: string) => {
    // Clear previous errors
    setDisplayNameError("");
    
    // Display name length between 1 and 30 characters
    if (value.length < 1 || value.length > 30) {
      setDisplayNameError("Display name must be between 1 and 30 characters");
      return false;
    }
    
    // Filter out offensive words or patterns if needed
    const offensiveWords = ["admin", "moderator", "official"]; // Example list
    if (offensiveWords.some(word => value.toLowerCase().includes(word))) {
      setDisplayNameError("Display name contains reserved or inappropriate words");
      return false;
    }
    
    return true;
  };

  const validateEmail = (value: string) => {
    setEmailError("");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const validatePassword = (value: string, confirmValue: string) => {
    setPasswordError("");
    
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    
    if (value !== confirmValue) {
      setPasswordError("Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    // Validate all inputs
    const isUsernameValid = validateUsername(username);
    const isDisplayNameValid = validateDisplayName(displayName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password, confirmPassword);
    
    if (!isUsernameValid || !isDisplayNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.register({
        username,
        email,
        displayName,
        password,
      });

      Alert.alert(
        "Registration Successful",
        "Please check your email for a verification code",
        [
          {
            text: "OK",
            onPress: () =>
              router.push({
                pathname: "/auth/verify",
                params: { email },
              }),
          },
        ]
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
      
      // Check for specific errors
      if (errorMessage.includes("username already exists")) {
        setUsernameError("Username is already taken");
      } else if (errorMessage.includes("email already exists")) {
        setEmailError("Email address is already registered");
      } else {
        Alert.alert(
          "Registration Failed",
          errorMessage
        );
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
          <ThemedText style={styles.title}>Create Account</ThemedText>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
              placeholder="Username (for login)"
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
              Username can only contain letters, numbers, underscores, and hyphens
            </ThemedText>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
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
              placeholder="Email Address"
              placeholderTextColor={iconColor}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError && (
            <ThemedText style={styles.errorText}>{emailError}</ThemedText>
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
              placeholder="Display Name (visible to others)"
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
              Display name is visible to other users
            </ThemedText>
          )}

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
              placeholder="Password"
              placeholderTextColor={iconColor}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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
              placeholder="Confirm Password"
              placeholderTextColor={iconColor}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (password) validatePassword(password, text);
              }}
            />
          </View>
          {passwordError && (
            <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.registerButton,
              (usernameError || displayNameError || emailError || passwordError) && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={loading || !!usernameError || !!displayNameError || !!emailError || !!passwordError}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.registerButtonText}>
                Create Account
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>
              Already have an account?{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <ThemedText style={styles.loginLink}>Sign In</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.termsText}>
            By registering, you agree to our Terms of Service and Privacy
            Policy.
          </ThemedText>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#FF6B6B",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  registerButton: {
    backgroundColor: "#AE75DA",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#D3B4E5",
  },
  registerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#999",
  },
  loginLink: {
    color: "#AE75DA",
    fontWeight: "bold",
  },
  termsText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
    fontSize: 12,
    color: "#999",
  },
});
