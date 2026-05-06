import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useApp } from "../../hooks/AppContext";
import { getColors } from "../../constants/theme";
import { validate, checkValidationLogin } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth.js";

export default function LoginScreen() {
  const router = useRouter();
  const { isDark, isLandscape } = useApp();
  const c = getColors(isDark);
  const styles = useMemo(() => createStyles(c), [c]);

  const [showPassword, setShowPassword] = useState(true);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const updateField = (name, value) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const isFormValid = checkValidationLogin(values, errors);

  function renderInput(label, name, secure = false) {
    const isFieldValid = values[name]?.length > 0 && !errors[name];
    return (
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          placeholder={`Enter your ${label.toLowerCase()}`}
          placeholderTextColor={c.textMuted}
          secureTextEntry={secure}
          autoCapitalize="none"
          inputMode={name === "email" ? "email" : "text"}
          style={[
            styles.input,
            errors[name] && styles.inputError,
            isFieldValid && styles.inputSuccess,
          ]}
          onChangeText={(v) => updateField(name, v)}
          value={values[name]}
        />
        {errors[name] ? (
          <Text style={styles.errorText}>{errors[name]}</Text>
        ) : (
          <View style={{ height: 18 }} />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isLandscape && styles.scrollLandscape,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View
            style={[styles.brandArea, isLandscape && styles.brandAreaLandscape]}
          >
            <View style={styles.filmStrip}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </View>
            <View style={styles.brandContent}>
              <Text style={styles.appName}>FLIQ</Text>
              <Text style={styles.tagline}>movies · people · moments</Text>
            </View>
            <View style={styles.filmStrip}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={[styles.form, isLandscape && styles.formLandscape]}>
            <Text style={styles.formTitle}>Welcome back</Text>
            {renderInput("Email", "email")}
            {renderInput("Password", "password", showPassword)}
            <Pressable
              onPress={() => setShowPassword((p) => !p)}
              style={styles.toggleContainer}
            >
              <Text style={styles.toggleText}>
                {showPassword ? "+ show password" : "− hide password"}
              </Text>
            </Pressable>
            <Pressable
              disabled={!isFormValid || isPending}
              style={[
                styles.button,
                (!isFormValid || isPending) && styles.disabled,
              ]}
              onPress={async () => {
                setIsPending(true);
                try {
                  const result = await login(values.email, values.password);
                  if (!result.success) {
                    alert(result.message);
                    return;
                  }
                  router.replace("/(tabs)/JoinRoom");
                } catch {
                  alert("Something went wrong.");
                } finally {
                  setIsPending(false);
                }
              }}
            >
              {isPending ? (
                <ActivityIndicator color={c.background} />
              ) : (
                <Text style={styles.buttonText}>Let me in</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/register")}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                New here?{"  "}
                <Text style={styles.linkHighlight}>Create account →</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      <StatusBar style={isDark ? "light" : "dark"} />
    </KeyboardAvoidingView>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    scrollLandscape: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      gap: 40,
    },
    brandArea: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 40,
    },
    brandAreaLandscape: {
      flexDirection: "column",
      marginBottom: 0,
      width: 160,
      gap: 20,
    },
    filmStrip: { gap: 6 },
    filmHole: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    brandContent: { alignItems: "center" },
    appName: {
      fontSize: 42,
      fontWeight: "900",
      color: c.primary,
      letterSpacing: 10,
    },
    tagline: {
      fontSize: 11,
      color: c.textMuted,
      letterSpacing: 3,
      textTransform: "uppercase",
      marginTop: 2,
    },
    form: { width: "100%", maxWidth: 400 },
    formLandscape: { flex: 1, maxWidth: 380 },
    formTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: c.text,
      marginBottom: 24,
    },
    inputWrapper: { marginBottom: 4 },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: c.textMuted,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: c.text,
      fontSize: 15,
    },
    inputError: { borderColor: c.error },
    inputSuccess: { borderColor: c.success },
    errorText: {
      color: c.error,
      fontSize: 12,
      marginTop: 5,
      marginLeft: 2,
      height: 18,
    },
    toggleContainer: { alignItems: "flex-end", marginBottom: 22, marginTop: 2 },
    toggleText: { color: c.textMuted, fontSize: 13, fontWeight: "500" },
    button: {
      backgroundColor: c.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
    },
    disabled: { backgroundColor: c.border },
    buttonText: {
      color: c.background,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    linkContainer: { marginTop: 28, alignItems: "center" },
    linkText: { color: c.textMuted, fontSize: 14 },
    linkHighlight: { color: c.primary, fontWeight: "600" },
  });
