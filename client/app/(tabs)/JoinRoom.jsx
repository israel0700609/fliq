import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "../../hooks/AppContext";
import { getColors } from "../../constants/theme";
import {
  handleSocket,
  SocketCreateParty,
  SocketJoinParty,
  getSocket,
} from "../../lib/socket.js";
import { useAuth } from "../../hooks/useAuth.js";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export default function JoinRoom() {
  const router = useRouter();
  const { isDark, isLandscape } = useApp();
  const c = getColors(isDark);
  const styles = useMemo(() => createStyles(c), [c]);
  const { user, logout } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = getSocket(SERVER_URL);
    setSocket(newSocket);
    const cleanup = handleSocket(newSocket, router);
    return () => cleanup();
  }, [router]);

  const handleCreateParty = () => {
    if (socket) SocketCreateParty(socket, user);
  };

  const handleJoinParty = () => {
    if (!socket) return;
    if (!socket.connected) {
      Alert.alert("Connection error", "Still connecting. Please try again.");
      return;
    }
    SocketJoinParty(roomCode, socket, user);
  };

  const Brand = (
    <View style={[styles.brandRow, isLandscape && styles.brandRowLandscape]}>
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
  );

  const Content = (
    <View
      style={[styles.contentCol, isLandscape && styles.contentColLandscape]}
    >
      {!isLandscape && Brand}

      <Text style={styles.pageTitle}>Watch together</Text>
      <Text style={styles.pageSubtitle}>
        host a room or join a friend's party
      </Text>

      {/* Create */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>host a party</Text>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="tv-outline" size={20} color={c.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Create a room</Text>
            <Text style={styles.cardDesc}>
              Generate a code and invite your friends to swipe movies together
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreateParty}
          >
            <Text style={styles.primaryButtonText}>Create →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Join */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>join a party</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter room code"
          placeholderTextColor={c.textMuted}
          value={roomCode}
          onChangeText={(v) => setRoomCode(v.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          returnKeyType="go"
          onSubmitEditing={handleJoinParty}
        />
        <TouchableOpacity
          style={[
            styles.joinButton,
            roomCode.trim().length === 0 && styles.joinButtonDisabled,
          ]}
          onPress={handleJoinParty}
          disabled={roomCode.trim().length === 0}
        >
          <Text style={styles.joinButtonText}>Join room</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={c.background}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLandscape && <View style={styles.brandColLandscape}>{Brand}</View>}
          {Content}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 32,
    },
    scrollLandscape: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 24,
      gap: 0,
    },

    brandColLandscape: { width: 180, alignItems: "center", paddingTop: 24 },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 28,
    },
    brandRowLandscape: { flexDirection: "column", gap: 16, marginBottom: 0 },
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

    contentCol: { flex: 1 },
    contentColLandscape: { flex: 1, paddingLeft: 32 },

    pageTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: c.text,
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    pageSubtitle: {
      fontSize: 13,
      color: c.textMuted,
      letterSpacing: 0.3,
      marginBottom: 36,
    },

    section: { marginBottom: 8 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textMuted,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 10,
    },

    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 16,
      gap: 10,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 6,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: { gap: 3 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: c.text },
    cardDesc: { fontSize: 13, color: c.textMuted, lineHeight: 18 },
    primaryButton: {
      alignSelf: "flex-start",
      backgroundColor: c.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      marginTop: 4,
    },
    primaryButtonText: {
      color: c.background,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 24,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { fontSize: 12, color: c.textMuted, letterSpacing: 1 },

    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 6,
      textAlign: "center",
      marginBottom: 10,
    },
    joinButton: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    joinButtonDisabled: { backgroundColor: c.border },
    joinButtonText: {
      color: c.background,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
  });
