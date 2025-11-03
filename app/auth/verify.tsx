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

export default function VerifyScreen() {
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
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const textColor = useThemeColor({}, 'text');

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

  const handleVerify = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      Alert.alert(t("error"), t("enterValidVerificationCode"));
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.verifyEmail({
        email: email as string,
        code,
      });

      Alert.alert(
        t("success"),
        t("emailVerifiedSuccess"),
        [{ text: t("ok"), onPress: () => router.push("/auth/login") }]
      );
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
      await AuthAPI.resendVerification(email as string);
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

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#AE75DA" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>{t("emailVerification")}</ThemedText>
      </View>

      <ThemedText style={styles.subtitle}>
        {t("verificationCodeSent6Digit")}{"\n"}
        <ThemedText style={styles.emailText}>{email}</ThemedText>
        {"\n"}{t("checkSpamFolder")}
      </ThemedText>

      <View style={styles.codeContainer}>
        {verificationCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[styles.codeInput, { color: textColor }]}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(value) => handleCodeChange(index, value)}
            onKeyPress={(e) => handleKeyPress(index, e)}
            autoFocus={index === 0}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.verifyButtonText}>{t("verify")}</ThemedText>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
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
  verifyButton: {
    backgroundColor: "#AE75DA",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyButtonText: {
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
