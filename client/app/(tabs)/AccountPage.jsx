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
} from "react-native";
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
  const { user, logout, updateUser } = useAuth();
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
    if (user) {
      setValues({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        phone: user.phone || "",
      });
    }
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
    if (success) {
      setIsEditing(false);
    } else {
      setErrors((p) => ({ ...p, _server: message }));
    }
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

  function renderField(label, name, keyboardType = "default") {
    const isFieldValid = values[name]?.length > 0 && !errors[name];
    const isDisabled = !isEditing;
    return (
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            isDisabled && styles.inputDisabled,
            errors[name] && styles.inputError,
            isFieldValid && isEditing && styles.inputSuccess,
          ]}
          value={values[name]}
          onChangeText={(v) => updateField(name, v)}
          editable={!isDisabled}
          placeholder={`Enter your ${label.toLowerCase()}`}
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

  const BrandAndHeader = (
    <View style={[styles.leftCol, isLandscape && styles.leftColLandscape]}>
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
      {isLandscape && (
        <>
          <Text style={styles.pageTitle}>My account</Text>
          <Text style={styles.pageSubtitle}>
            {isEditing ? "editing your profile" : "your profile info"}
          </Text>
        </>
      )}
    </View>
  );

  const FormContent = (
    <View style={[styles.rightCol, isLandscape && styles.rightColLandscape]}>
      {!isLandscape && (
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>My account</Text>
            <Text style={styles.pageSubtitle}>
              {isEditing ? "editing your profile" : "your profile info"}
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
              {isEditing ? "Cancel" : "Edit"}
            </Text>
          </Pressable>
        </View>
      )}

      {isLandscape && (
        <Pressable
          style={[
            styles.editButton,
            { alignSelf: "flex-end", marginBottom: 16 },
          ]}
          onPress={isEditing ? handleCancelEdit : () => setIsEditing(true)}
        >
          <Ionicons
            name={isEditing ? "close" : "create-outline"}
            size={16}
            color={isEditing ? c.textMuted : c.primary}
          />
          <Text
            style={[styles.editButtonText, isEditing && { color: c.textMuted }]}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Text>
        </Pressable>
      )}

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={user?.email || ""}
          editable={false}
          placeholderTextColor={c.textMuted}
        />
        <View style={{ height: 16 }} />
      </View>

      {renderField("First name", "firstname")}
      {renderField("Last name", "lastname")}
      {renderField("Phone", "phone", "phone-pad")}

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
            <Text style={styles.saveButtonText}>Save changes</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons
          name="log-out-outline"
          size={16}
          color={c.error}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isLandscape && styles.scrollLandscape,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {BrandAndHeader}
          {FormContent}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48 },
    scrollLandscape: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 24,
      gap: 32,
    },

    leftCol: {},
    leftColLandscape: { width: 180, paddingTop: 8, alignItems: "center" },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 28,
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

    rightCol: {},
    rightColLandscape: { flex: 1 },

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
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: c.primary,
      letterSpacing: 0.3,
    },

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
  });
