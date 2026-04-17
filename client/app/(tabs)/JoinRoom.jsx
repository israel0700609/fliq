import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import Colors from '../../constants/Colors';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to server with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Connection Error:', err.message);
    });
    socket.on('room_joined', (roomId) => {
      setCurrentRoom(roomId);
      setIsHost(false);
      setInRoom(true);
    });

    socket.on('room_created', (roomId) => {
      setCurrentRoom(roomId);
      console.log(roomId);
      setIsHost(true);
      setInRoom(true);
    });

    socket.on('error_msg', (msg) => {
      Alert.alert('Error', msg);
    });

    return () => {
      socket.off('room_joined');
      socket.off('room_created');
      socket.off('error_msg');
    };
  }, []);

  const handleCreateParty = () => {
    socket.emit('create_room');
  };

  const handleJoinParty = () => {
    if (roomCode.trim().length === 0) return;
    socket.emit('join_room', roomCode.trim().toUpperCase());
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room', currentRoom);
    setInRoom(false);
    setCurrentRoom('');
    setRoomCode('');
    setIsHost(false);
  };

  // ── In-room view ────────────────────────────────────────────────────────────
  if (inRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inRoomContent}>

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

          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeLabel}>
              {isHost ? 'you created' : 'you joined'}
            </Text>
          </View>

          <Text style={styles.roomTitle}>Watch party</Text>
          <Text style={styles.roomSubtitle}>
            {isHost
              ? 'Share the code with your friends'
              : 'Waiting for the host to start...'}
          </Text>

          {/* Room code display */}
          <Pressable
            style={styles.codeBlock}
            onPress={() => {
              // Clipboard.setStringAsync(currentRoom); // uncomment if expo-clipboard is installed
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <Text style={styles.codeText}>{currentRoom}</Text>
            <View style={styles.codeCopyHint}>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? Colors.success : Colors.textMuted}
              />
              <Text style={[styles.codeCopyText, copied && { color: Colors.success }]}>
                {copied ? 'copied' : 'tap to copy'}
              </Text>
            </View>
          </Pressable>

          {/* Placeholder for queue / swipe feature */}
          <View style={styles.queuePlaceholder}>
            <Ionicons name="film-outline" size={28} color={Colors.border} />
            <Text style={styles.queuePlaceholderText}>
              Movie queue goes here
            </Text>
            <Text style={styles.queuePlaceholderSub}>
              coming soon
            </Text>
          </View>

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
            <Text style={styles.leaveButtonText}>Leave room</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  // ── Lobby view ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.lobbyContent}>

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

  /* Shared brand */
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

  // ── Lobby ──
  lobbyContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
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

  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  /* Host card */
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
  cardBody: {
    gap: 3,
  },
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

  /* Divider */
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

  /* Join input */
  inputWrapper: {
    marginBottom: 10,
  },
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

  // ── In-room ──
  inRoomContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  roomBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  roomBadgeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  roomTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  roomSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 32,
    textAlign: 'center',
  },

  /* Code block */
  codeBlock: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    width: '100%',
  },
  codeText: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 10,
  },
  codeCopyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeCopyText: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  /* Queue placeholder */
  queuePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  queuePlaceholderText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  queuePlaceholderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.5,
  },

  /* Leave */
  leaveButton: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'center',
  },
  leaveButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});