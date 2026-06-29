import i18n from "../../languages/i18n";
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "../../hooks/AppContext";
import { getColors } from "../../constants/theme";
import { validate, checkValidationUpdate } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth.js";

export default function AccountPage() {
  const { isDark, isLandscape } = useApp();
  const c = getColors(isDark);
  const styles = useMemo(() => createStyles(c), [c]);
  const { user, logout, updateUser, deleteUser } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    phone: user?.phone || "",
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user)
      setValues({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        phone: user.phone || "",
      });
  }, [user]);

  const updateField = (name, value) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validate(name, value) }));
  };

  const isFormValid = checkValidationUpdate(values, errors);

  const handleUpdate = async () => {
    if (!isFormValid) return;
    setIsPending(true);
    const { success, message } = await updateUser(values);
    setIsPending(false);
    if (success) setIsEditing(false);
    else setErrors((p) => ({ ...p, _server: message }));
  };

  const handleCancelEdit = () => {
    setValues({
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      phone: user?.phone || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      i18n.t("deleteAccountConfirmTitle"),
      i18n.t("deleteAccountConfirmMessage"),
      [
        {
          text: i18n.t("cancel"),
          style: "cancel",
        },
        {
          text: i18n.t("delete"),
          style: "destructive",
          onPress: async () => {
            setIsPending(true);
            const { success, message } = await deleteUser();
            setIsPending(false);
            if (success) {
              router.replace("/(auth)/login");
            } else {
              Alert.alert(i18n.t("somethingWentWrong"), message);
            }
          },
        },
      ],
    );
  };

  function renderField(label, name, keyboardType = "default") {
    const isFieldValid = values[name]?.length > 0 && !errors[name];
    return (
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            !isEditing && styles.inputDisabled,
            errors[name] && styles.inputError,
            isFieldValid && isEditing && styles.inputSuccess,
          ]}
          value={values[name]}
          onChangeText={(v) => updateField(name, v)}
          editable={isEditing}
          placeholder={i18n.t("enterYourField", { field: label.toLowerCase() })}
          placeholderTextColor={c.textMuted}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {errors[name] ? (
          <Text style={styles.errorText}>{errors[name]}</Text>
        ) : (
          <View style={{ height: 16 }} />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={
          isDark
            ? ["#0b0a1f", "#17143a", "#241f56"]
            : ["#f4f2ff", "#ede8ff", "#e8e2ff"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <View pointerEvents="none" style={styles.glowCircleTop} />
      <View pointerEvents="none" style={styles.glowCircleBottom} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {}
          <View style={styles.brandRow}>
            <View style={styles.filmStrip}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </View>
            <Text style={styles.appName}>FLIQ</Text>
            <View style={styles.filmStrip}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </View>
          </View>

          {}
          <View style={styles.pageHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.pageTitle}>{i18n.t("myAccount")}</Text>
              <Text style={styles.pageSubtitle}>
                {isEditing
                  ? i18n.t("editingProfile")
                  : i18n.t("yourProfileInfo")}
              </Text>
            </View>
            <Pressable
              style={styles.editButton}
              onPress={isEditing ? handleCancelEdit : () => setIsEditing(true)}
            >
              <Ionicons
                name={isEditing ? "close" : "create-outline"}
                size={16}
                color={isEditing ? c.textMuted : c.primary}
              />
              <Text
                style={[
                  styles.editButtonText,
                  isEditing && { color: c.textMuted },
                ]}
              >
                {isEditing ? i18n.t("cancel") : i18n.t("edit")}
              </Text>
            </Pressable>
          </View>

          {}
          <View style={[styles.form, isLandscape && styles.formLandscape]}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{i18n.t("email")}</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ""}
                editable={false}
                placeholderTextColor={c.textMuted}
              />
              <View style={{ height: 16 }} />
            </View>

            {renderField(i18n.t("firstName"), "firstname")}
            {renderField(i18n.t("lastName"), "lastname")}
            {renderField(i18n.t("phone"), "phone", "phone-pad")}

            {errors._server && (
              <Text style={styles.serverError}>{errors._server}</Text>
            )}

            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!isFormValid || isPending) && styles.saveButtonDisabled,
                ]}
                onPress={handleUpdate}
                disabled={!isFormValid || isPending}
              >
                {isPending ? (
                  <ActivityIndicator color={c.background} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {i18n.t("saveChanges")}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={c.error}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.logoutText}>{i18n.t("logout")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={c.error}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.deleteText}>{i18n.t("deleteAccount")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    glowCircleTop: {
      position: "absolute",
      top: -120,
      left: -110,
      width: 300,
      height: 300,
      borderRadius: 150,
      borderWidth: 2,
      borderColor: "rgba(124,92,255,0.25)",
    },
    glowCircleBottom: {
      position: "absolute",
      bottom: -180,
      right: -120,
      width: 360,
      height: 360,
      borderRadius: 180,
      borderWidth: 2,
      borderColor: "rgba(167,139,250,0.18)",
    },
    scroll: {
      paddingHorizontal: 24,
      paddingTop: 36,
      paddingBottom: 48,
      alignItems: "center",
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 28,
      alignSelf: "center",
    },
    filmStrip: { gap: 5 },
    filmHole: {
      width: 6,
      height: 6,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    appName: {
      fontSize: 28,
      fontWeight: "900",
      color: c.primary,
      letterSpacing: 8,
    },

    pageHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 28,
      width: "100%",
      maxWidth: 480,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: c.text,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      fontSize: 13,
      color: c.textMuted,
      letterSpacing: 0.3,
      marginTop: 4,
    },

    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      flexShrink: 0,
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: c.primary,
      letterSpacing: 0.3,
    },

    form: { width: "100%" },
    formLandscape: { maxWidth: 480 },

    inputWrapper: { marginBottom: 2 },
    inputLabel: {
      fontSize: 11,
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
    inputDisabled: { opacity: 0.45 },
    inputError: { borderColor: c.error },
    inputSuccess: { borderColor: c.success },
    errorText: {
      color: c.error,
      fontSize: 12,
      marginTop: 5,
      marginLeft: 2,
      height: 16,
    },
    serverError: {
      color: c.error,
      fontSize: 13,
      textAlign: "center",
      marginBottom: 12,
    },

    saveButton: {
      backgroundColor: c.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
    },
    saveButtonDisabled: { backgroundColor: c.border },
    saveButtonText: {
      color: c.background,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    divider: { height: 1, backgroundColor: c.border, marginVertical: 28 },

    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    logoutText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.error,
      letterSpacing: 0.3,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "transparent",
      marginTop: 12,
    },
    deleteText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.error,
      letterSpacing: 0.3,
      textDecorationLine: "underline",
    },
  });
