import { AuthAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { t } = useLocalization();
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [step, setStep] = useState(1); // 1 = verification code, 2 = new password
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input when a digit is entered
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, event: any) => {
    // Handle backspace
    if (event.nativeEvent.key === "Backspace") {
      if (verificationCode[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      Alert.alert(t("error"), t("enterValidVerificationCode"));
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.verifyResetCode({
        email: email as string,
        code,
      });
      setStep(2); // Move to password reset step
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert(
        t("verificationFailed"),
        error.response?.data?.message || t("invalidVerificationCode")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    try {
      await AuthAPI.forgotPassword(email as string);
      setResendCountdown(60); // 1 minute cooldown
      Alert.alert(
        t("success"),
        t("verificationCodeSent")
      );
    } catch (error: any) {
      console.error("Resend error:", error);
      Alert.alert(
        t("resendCodeFailed"),
        error.response?.data?.message || t("tryAgainLater")
      );
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t("error"), t("enterAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), t("passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t("error"), t("passwordMinLength"));
      return;
    }

    setLoading(true);
    try {
      const code = verificationCode.join("");
      await AuthAPI.resetPassword({
        email: email as string,
        code,
        newPassword,
      });

      Alert.alert(t("success"), t("passwordResetSuccess"), [
        { text: t("ok"), onPress: () => router.replace("/auth/login") },
      ]);
    } catch (error: any) {
      console.error("Password reset error:", error);
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("passwordResetFailed")
      );
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
          <ThemedText style={styles.title}>{t("resetPassword")}</ThemedText>
        </View>

        {step === 1 ? (
          // Verification Code Step
          <>
            <ThemedText style={styles.subtitle}>
              {t("enterVerificationCode")}{" "}
              <ThemedText style={styles.emailText}>{email}</ThemedText>
            </ThemedText>

            <View style={styles.codeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.codeInput, { color: textColor }]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={(e) => handleKeyPress(index, e)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>{t("verifyCode")}</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <ThemedText style={styles.resendText}>
                {t("didntReceiveCode")}{" "}
              </ThemedText>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={resendCountdown > 0}
              >
                <ThemedText
                  style={[
                    styles.resendLink,
                    resendCountdown > 0 && { color: "#999" },
                  ]}
                >
                  {resendCountdown > 0
                    ? t("resendInSeconds", { seconds: resendCountdown })
                    : t("resendCode")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // New Password Step
          <>
            <ThemedText style={styles.subtitle}>
              {t("enterNewPassword")}
            </ThemedText>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t("newPassword")}
                placeholderTextColor={iconColor}
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={iconColor}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t("confirmPassword")}
                placeholderTextColor={iconColor}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {t("resetPassword")}
                </ThemedText>
              )}
            </TouchableOpacity>
          </>
        )}
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
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  emailText: {
    fontWeight: "bold",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "rgba(174, 117, 218, 0.5)",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#AE75DA",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  resendText: {
    color: "#999",
  },
  resendLink: {
    color: "#AE75DA",
    fontWeight: "bold",
  },
});
