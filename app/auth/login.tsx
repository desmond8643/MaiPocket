import { AuthAPI } from "@/api/client";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      Alert.alert(t("error"), t("enterAllFields"));
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.login({ usernameOrEmail, password });
      console.log("Login successful:", response);
      router.replace("/(tabs)/profile");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response?.data?.needsVerification) {
        // Redirect to verification screen with email
        router.push({
          pathname: "/auth/verify",
          params: { email: error.response.data.email },
        });
      } else {
        Alert.alert(
          t("loginFailed"),
          error.response?.data?.message ||
            t("loginError")
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
          <ThemedText style={styles.title}>{t("signIn")}</ThemedText>
        </View>
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color={iconColor}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder={t("usernameOrEmail")}
            placeholderTextColor={iconColor}
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            autoCapitalize="none"
          />
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
              color={iconColor}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push("/auth/forgot-password")}
        >
          <ThemedText style={styles.forgotPasswordText}>
            {t("forgotPassword")}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.loginButtonText}>{t("signIn")}</ThemedText>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <ThemedText style={styles.registerText}>
            {t("dontHaveAccount")}{" "}
          </ThemedText>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <ThemedText style={styles.registerLink}>{t("signUp")}</ThemedText>
          </TouchableOpacity>
        </View>
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
    // color is now dynamic and passed as a style prop
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#AE75DA",
  },
  loginButton: {
    backgroundColor: "#AE75DA",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#999",
  },
  registerLink: {
    color: "#AE75DA",
    fontWeight: "bold",
  },
});
