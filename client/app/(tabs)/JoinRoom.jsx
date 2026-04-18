import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import {handleSocket,SocketCreateParty,SocketJoinParty,getSocket} from '../../lib/socket.js';
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const socket = getSocket(SERVER_URL);

export default function JoinRoom() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    return handleSocket(socket, router);
  }, [router]);

  const handleCreateParty = () => {
    SocketCreateParty(socket);
  };

  const handleJoinParty = () => {
    SocketJoinParty(roomCode,socket);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>

          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.filmStrip}>
              {[...Array(4)].map((_, i) => <View key={i} style={styles.filmHole} />)}
            </View>
            <Text style={styles.appName}>FLIQ</Text>
            <View style={styles.filmStrip}>
              {[...Array(4)].map((_, i) => <View key={i} style={styles.filmHole} />)}
            </View>
          </View>

          <Text style={styles.pageTitle}>Watch together</Text>
          <Text style={styles.pageSubtitle}>host a room or join a friend's party</Text>

          {/* Create room */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>host a party</Text>
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="tv-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Create a room</Text>
                <Text style={styles.cardDesc}>
                  Generate a code and invite your friends to swipe movies together
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreateParty}>
                <Text style={styles.primaryButtonText}>Create →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Join room */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>join a party</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter room code"
                placeholderTextColor={Colors.textMuted}
                value={roomCode}
                onChangeText={(v) => setRoomCode(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                returnKeyType="go"
                onSubmitEditing={handleJoinParty}
              />
            </View>
            <TouchableOpacity
              style={[styles.joinButton, roomCode.trim().length === 0 && styles.joinButtonDisabled]}
              onPress={handleJoinParty}
              disabled={roomCode.trim().length === 0}
            >
              <Text style={styles.joinButtonText}>Join room</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.background} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  filmStrip: { gap: 5 },
  filmHole: {
    width: 6,
    height: 6,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 8,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 36,
  },

  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { gap: 3 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 4,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  inputWrapper: { marginBottom: 10 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: Colors.border,
  },
  joinButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});