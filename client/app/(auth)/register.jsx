import i18n from "../../languages/i18n";
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
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useApp } from "../../hooks/AppContext";
import { getColors } from "../../constants/theme";
import { calculateAge, validate, checkValidation } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth.js";

export default function RegisterScreen() {
  const { isDark, isLandscape } = useApp();
  const c = getColors(isDark);
  const styles = useMemo(() => createStyles(c), [c]);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [birthday, setBirthday] = useState(null);
  const { register } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [values, setValues] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const updateField = (name, value) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const isFormValid = checkValidation(values, errors, birthday);

  function renderInput(label, name, secure = false, optional = false) {
    const isFieldValid = values[name]?.length > 0 && !errors[name];
    return (
      <View style={styles.inputWrapper}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {optional && (
            <Text style={styles.optionalTag}>{i18n.t("optional")}</Text>
          )}
        </View>
        <TextInput
          placeholder={i18n.t("enterYourField", { field: label.toLowerCase() })}
          placeholderTextColor={c.textMuted}
          secureTextEntry={secure}
          autoCapitalize="none"
          inputMode={
            name === "email" ? "email" : name === "phone" ? "tel" : "text"
          }
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
          <View style={{ height: 16 }} />
        )}
      </View>
    );
  }

  const Header = (
    <View style={[styles.header, isLandscape && styles.headerLandscape]}>
      <Text style={styles.appName}>FLIQ</Text>
      <View style={styles.dividerLine} />
      <Text style={styles.subtitle}>{i18n.t("createYourAccount")}</Text>
    </View>
  );

  const Form = (
    <View style={[styles.form, isLandscape && styles.formLandscape]}>
      <Text style={styles.stepLabel}>{i18n.t("whoAreYou")}</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {renderInput(i18n.t("firstName"), "firstname")}
        </View>
        <View style={{ flex: 1 }}>
          {renderInput(i18n.t("lastName"), "lastname")}
        </View>
      </View>

      {renderInput(i18n.t("email"), "email")}
      {renderInput(i18n.t("phone"), "phone", false, true)}
      {renderInput(i18n.t("password"), "password", showPassword)}

      <Pressable
        onPress={() => setShowPassword((p) => !p)}
        style={styles.toggleContainer}
      >
        <Text style={styles.toggleText}>
          {showPassword
            ? `+ ${i18n.t("showPassword")}`
            : `− ${i18n.t("hidePassword")}`}
        </Text>
      </Pressable>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{i18n.t("dob")}</Text>
        <Pressable
          style={[styles.input, { justifyContent: "center" }]}
          onPress={() => setShowDate(true)}
        >
          <Text
            style={{ color: birthday ? c.text : c.textMuted, fontSize: 15 }}
          >
            {birthday
              ? birthday.toLocaleDateString()
              : i18n.t("selectBirthday")}
          </Text>
        </Pressable>
        {birthday && calculateAge(birthday) < 21 ? (
          <Text style={styles.errorText}>{i18n.t("invalidDate")}</Text>
        ) : (
          <View style={{ height: 16 }} />
        )}
      </View>

      <DateTimePickerModal
        isVisible={showDate}
        mode="date"
        maximumDate={new Date()}
        isDarkModeEnabled={isDark}
        onConfirm={(d) => {
          setBirthday(d);
          setShowDate(false);
        }}
        onCancel={() => setShowDate(false)}
      />

      <Pressable
        disabled={!isFormValid || isPending}
        style={[styles.button, (!isFormValid || isPending) && styles.disabled]}
        onPress={async () => {
          setIsPending(true);
          try {
            const result = await register(
              values.firstname,
              values.lastname,
              values.email,
              values.password,
              values.phone,
              birthday,
            );
            if (!result.success) alert(result.message);
          } catch {
            alert(i18n.t("somethingWentWrong"));
          } finally {
            setIsPending(false);
          }
        }}
      >
        {isPending ? (
          <ActivityIndicator color={c.background} />
        ) : (
          <Text style={styles.buttonText}>{i18n.t("joinFliq")}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/login")}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>
          {i18n.t("alreadyHaveAccount")}
          {"  "}
          <Text style={styles.linkHighlight}>{i18n.t("signIn")}</Text>
        </Text>
      </Pressable>
    </View>
  );

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
          {Header}
          {Form}
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
      paddingVertical: 48,
    },
    scrollLandscape: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingVertical: 24,
      gap: 40,
    },
    header: { alignItems: "center", marginBottom: 32 },
    headerLandscape: {
      width: 160,
      justifyContent: "center",
      marginBottom: 0,
      paddingTop: 24,
    },
    appName: {
      fontSize: 36,
      fontWeight: "900",
      color: c.primary,
      letterSpacing: 10,
    },
    dividerLine: {
      width: 32,
      height: 1,
      backgroundColor: c.border,
      marginVertical: 10,
    },
    subtitle: {
      fontSize: 15,
      color: c.textMuted,
      letterSpacing: 0.5,
      textAlign: "center",
    },
    stepLabel: {
      fontSize: 11,
      color: c.textMuted,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    form: { width: "100%", maxWidth: 420 },
    formLandscape: { flex: 1, maxWidth: 420 },
    row: { flexDirection: "row", gap: 12 },
    inputWrapper: { marginBottom: 2 },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textMuted,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    optionalTag: {
      fontSize: 10,
      color: c.textMuted,
      opacity: 0.5,
      fontStyle: "italic",
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
      height: 16,
    },
    toggleContainer: {
      alignItems: "flex-end",
      marginBottom: 16,
      marginTop: -2,
    },
    toggleText: { color: c.textMuted, fontSize: 13, fontWeight: "500" },
    button: {
      backgroundColor: c.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
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
