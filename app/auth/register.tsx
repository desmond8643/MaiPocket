import { AuthAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLocalization(); // Add this line
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");
  const colorScheme = useColorScheme();

  const validateUsername = (value: string) => {
    // Clear previous errors
    setUsernameError("");

    // Username length between 3 and 20 characters
    if (value.length < 3 || value.length > 20) {
      setUsernameError(t("usernameLengthError"));
      return false;
    }

    // Only allow letters, numbers, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError(t("usernameCharactersError"));
      return false;
    }

    return true;
  };

  const validateDisplayName = (value: string) => {
    // Clear previous errors
    setDisplayNameError("");

    // Display name length between 1 and 30 characters
    if (value.length < 1 || value.length > 30) {
      setDisplayNameError(t("displayNameLengthError"));
      return false;
    }

    // Filter out offensive words or patterns if needed
    const offensiveWords = ["admin", "moderator", "official"]; // Example list
    if (offensiveWords.some((word) => value.toLowerCase().includes(word))) {
      setDisplayNameError(t("displayNameOffensiveError"));
      return false;
    }

    return true;
  };

  const validateEmail = (value: string) => {
    setEmailError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError(t("invalidEmailError"));
      return false;
    }

    return true;
  };

  const validatePassword = (value: string, confirmValue: string) => {
    setPasswordError("");

    if (value.length < 8) {
      setPasswordError(t("passwordLengthError"));
      return false;
    }

    if (value !== confirmValue) {
      setPasswordError(t("passwordMatchError"));
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

    // Validate terms acceptance
    if (!termsAccepted) {
      setTermsError(t("termsRequiredError"));
      return;
    } else {
      setTermsError("");
    }

    if (
      !isUsernameValid ||
      !isDisplayNameValid ||
      !isEmailValid ||
      !isPasswordValid
    ) {
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
        t("registrationSuccessful"),
        t("checkEmailForVerification"),
        [
          {
            text: t("ok"),
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
      const errorMessage =
        error.response?.data?.message || t("genericError");

      // Check for specific errors
      if (errorMessage.includes("username already exists")) {
        setUsernameError(t("usernameExistsError"));
      } else if (errorMessage.includes("email already exists")) {
        setEmailError(t("emailExistsError"));
      } else {
        Alert.alert(t("registrationFailed"), errorMessage);
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
          <ThemedText style={styles.title}>{t("createAccount")}</ThemedText>
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
              placeholder={t("usernameForLogin")}
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
              {t("usernameHelperText")}
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
              placeholder={t("emailAddress")}
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
              placeholder={t("displayNameVisible")}
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
              {t("displayNameHelperText")}
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
              placeholder={t("password")}
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
              placeholder={t("confirmPassword")}
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

          <View style={styles.termsContainer}>
            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={styles.checkboxContainer}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted ? styles.checkboxChecked : null,
                ]}
              >
                {termsAccepted && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.termsText}>
              {t("termsAgreement")}
            </ThemedText>
          </View>
          {termsError ? (
            <ThemedText style={styles.errorText}>{termsError}</ThemedText>
          ) : null}

          <TouchableOpacity
            style={[
              styles.registerButton,
              (usernameError ||
                displayNameError ||
                emailError ||
                passwordError) &&
                styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={
              loading ||
              !!usernameError ||
              !!displayNameError ||
              !!emailError ||
              !!passwordError
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.registerButtonText}>
                {t("createAccount")}
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>
              {t("alreadyHaveAccount")}{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <ThemedText style={styles.loginLink}>{t("signIn")}</ThemedText>
            </TouchableOpacity>
          </View>
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
  // Add these styles at the end of your StyleSheet
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  termsText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#999",
  },
  checkboxContainer: {
    padding: 5, // Makes the touchable area bigger
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#AE75DA",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#AE75DA",
  },
});
