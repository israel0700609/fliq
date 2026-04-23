import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, StyleSheet,
  SafeAreaView, Modal, TextInput, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import io from 'socket.io-client';
import Colors from '../../constants/Colors';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

function SpotifyConnectSheet({ visible, onClose, onConnected, roomId }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (!SERVER_URL) {
        console.error('Missing EXPO_PUBLIC_SERVER_URL');
        Alert.alert('Spotify', 'Missing EXPO_PUBLIC_SERVER_URL in client/.env');
        return;
      }
      const baseUrl = SERVER_URL.replace(/\/$/, '');
      const redirectUrl = Linking.createURL('spotify-callback');
      const authUrl = `${baseUrl}/api/auth/spotify?roomId=${encodeURIComponent(roomId)}&mobileRedirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      console.log('[Spotify] auth session result:', result?.type, result?.url);

      if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const success = parsed.queryParams?.success;

      if (success === 'true') {
        socket.emit('spotify_connected_alert', { roomId }); 
        onConnected();
        onClose();
        Alert.alert('Spotify', 'Connected successfully');
        return;
      }

        Alert.alert('Spotify', 'Auth returned without code. Please try again.');
        return;
      }

      Alert.alert('Spotify', `Auth did not complete (${result.type}).`);
    } catch (err) {
      console.error('Spotify auth error:', err);
      Alert.alert('Spotify', 'Connection failed. Check server URL and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {/* Spotify logo area */}
        <View style={styles.spotifyLogoRow}>
          <View style={styles.spotifyIconWrap}>
            <Ionicons name="musical-notes" size={28} color="#1DB954" />
          </View>
        </View>

        <Text style={styles.sheetTitle}>Connect Spotify</Text>
        <Text style={styles.sheetSubtitle}>
          Sign in so your party can play music. Your account controls playback for everyone in the room.
        </Text>

        <View style={styles.featureList}>
          {[
            { icon: 'search-outline',       label: 'Search any song on Spotify' },
            { icon: 'list-outline',          label: 'Build a shared queue together' },
            { icon: 'play-circle-outline',   label: 'Control playback for the room' },
          ].map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={15} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.spotifyButton, isConnecting && { opacity: 0.7 }]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Ionicons name="logo-spotify" size={18} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.spotifyButtonText}>Continue with Spotify</Text>
            </>
          )}
        </TouchableOpacity>

        <Pressable onPress={onClose} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Search sheet ─────────────────────────────────────────────────────────────
function SearchSheet({ visible, onClose, roomId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    socket.on('searched_track', (tracks) => {
      setResults(tracks);
      setIsSearching(false);
    });
    return () => socket.off('searched_track');
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length === 0) { setResults([]); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      socket.emit('search_track', text.trim());
    }, 500);
  };

  const handleAdd = (track) => {
    setAddedIds((prev) => [...prev, track.id]);
    socket.emit('add_to_queue', { track, roomId });
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setAddedIds([]);
    onClose();
  };

  const formatDuration = (ms) => {
    if (!ms) return '';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrapper}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Add to queue</Text>
              <Text style={styles.sheetSubtitle}>search any song on Spotify</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Song, artist or album..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setResults([]); }}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          {isSearching ? (
            <View style={styles.centeredState}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : results.length === 0 && query.length > 0 ? (
            <View style={styles.centeredState}>
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centeredState}>
              <Ionicons name="musical-notes-outline" size={32} color={Colors.border} />
              <Text style={styles.emptyText}>Start typing to search</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const added = addedIds.includes(item.id);
                return (
                  <View style={styles.trackRow}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.albumArt} />
                    ) : (
                      <View style={[styles.albumArt, styles.albumArtFallback]}>
                        <Ionicons name="musical-note" size={16} color={Colors.border} />
                      </View>
                    )}
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>
                    {item.duration_ms && (
                      <Text style={styles.trackDuration}>{formatDuration(item.duration_ms)}</Text>
                    )}
                    <Pressable
                      style={[styles.addButton, added && styles.addButtonDone]}
                      onPress={() => !added && handleAdd(item)}
                      disabled={added}
                    >
                      <Ionicons
                        name={added ? 'checkmark' : 'add'}
                        size={16}
                        color={added ? Colors.success : Colors.background}
                      />
                    </Pressable>
                  </View>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WatchParty() {
  const router = useRouter();
  const { roomId, isHost: isHostParam } = useLocalSearchParams();
  const isHost = isHostParam === 'true';

  const [copied, setCopied] = useState(false);
  const [memberCount, setMemberCount] = useState(1);
  const [queue, setQueue] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [spotifySheetVisible, setSpotifySheetVisible] = useState(isHost);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    socket.on('member_count', setMemberCount);
    socket.on('queue_updated', setQueue);
    socket.on('room_closed', () => router.replace('/(tabs)/JoinRoom'));
    socket.on('spotify_connected', () => setSpotifyConnected(true));
    return () => {
      socket.off('member_count');
      socket.off('queue_updated');
      socket.off('room_closed');
      socket.off('spotify_connected');
    };
  }, []);

  const handleLeaveRoom = () => {
    socket.emit('leave_room', roomId);
    router.replace('/(tabs)/JoinRoom');
  };

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.filmStrip}>
              {[...Array(3)].map((_, i) => <View key={i} style={styles.filmHole} />)}
            </View>
            <Text style={styles.appName}>FLIQ</Text>
            <View style={styles.filmStrip}>
              {[...Array(3)].map((_, i) => <View key={i} style={styles.filmHole} />)}
            </View>
          </View>
          <View style={styles.memberPill}>
            <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.memberText}>{memberCount}</Text>
          </View>
        </View>

        {/* Badge + title */}
        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeLabel}>
            {isHost ? 'you created' : 'you joined'}
          </Text>
        </View>
        <Text style={styles.roomTitle}>Watch party</Text>
        <Text style={styles.roomSubtitle}>
          {isHost ? 'Share the code with your friends' : 'Waiting for the host to start...'}
        </Text>

        {/* Spotify status banner — host only, shown after sheet is dismissed */}
        {isHost && !spotifySheetVisible && (
          <Pressable
            style={[styles.spotifyBanner, spotifyConnected && styles.spotifyBannerConnected]}
            onPress={() => !spotifyConnected && setSpotifySheetVisible(true)}
          >
            <Ionicons
              name={spotifyConnected ? 'checkmark-circle' : 'musical-notes-outline'}
              size={15}
              color={spotifyConnected ? '#1DB954' : Colors.textMuted}
            />
            <Text style={[styles.spotifyBannerText, spotifyConnected && { color: '#1DB954' }]}>
              {spotifyConnected ? 'Spotify connected' : 'Connect Spotify for playback'}
            </Text>
            {!spotifyConnected && (
              <Ionicons name="chevron-forward" size={13} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
            )}
          </Pressable>
        )}

        {/* Room code */}
        <Pressable style={styles.codeBlock} onPress={handleCopyCode}>
          <Text style={styles.codeLabel}>room code</Text>
          <Text style={styles.codeText}>{roomId}</Text>
          <View style={styles.codeCopyHint}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={13}
              color={copied ? Colors.success : Colors.textMuted}
            />
            <Text style={[styles.codeCopyText, copied && { color: Colors.success }]}>
              {copied ? 'copied' : 'tap to copy'}
            </Text>
          </View>
        </Pressable>

        {/* Queue */}
        <View style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <Text style={styles.sectionLabel}>queue</Text>
            <Pressable style={styles.addSongButton} onPress={() => setSearchVisible(true)}>
              <Ionicons name="add" size={15} color={Colors.background} />
              <Text style={styles.addSongText}>Add song</Text>
            </Pressable>
          </View>

          {queue.length === 0 ? (
            <View style={styles.queueEmpty}>
              <Ionicons name="musical-notes-outline" size={26} color={Colors.border} />
              <Text style={styles.queueEmptyText}>Add songs to get started</Text>
            </View>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(item, i) => item.id + i}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item, index }) => (
                <View style={styles.queueTrackRow}>
                  <Text style={styles.queueIndex}>{index + 1}</Text>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.queueArt} />
                  ) : (
                    <View style={[styles.queueArt, styles.albumArtFallback]}>
                      <Ionicons name="musical-note" size={12} color={Colors.border} />
                    </View>
                  )}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Leave */}
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Ionicons name="exit-outline" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.leaveButtonText}>
            {isHost ? 'Close room' : 'Leave room'}
          </Text>
        </TouchableOpacity>

      </View>

      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} roomId={roomId} />

      {isHost && (
        <SpotifyConnectSheet
          visible={spotifySheetVisible}
          roomId={roomId}
          onClose={() => setSpotifySheetVisible(false)}
          onConnected={() => setSpotifyConnected(true)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, alignItems: 'center' },

  header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filmStrip: { gap: 4 },
  filmHole: { width: 5, height: 5, borderRadius: 2, backgroundColor: Colors.border },
  appName: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: 7 },
  memberPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  memberText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  roomBadge: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  roomBadgeLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  roomTitle: { fontSize: 26, fontWeight: '700', color: Colors.text, marginBottom: 6, letterSpacing: -0.3 },
  roomSubtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 16, textAlign: 'center' },

  /* Spotify banner */
  spotifyBanner: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  spotifyBannerConnected: { borderColor: '#1DB954' },
  spotifyBannerText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  codeBlock: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center', gap: 6, marginBottom: 24, width: '100%' },
  codeLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  codeText: { fontSize: 32, fontWeight: '900', color: Colors.primary, letterSpacing: 10 },
  codeCopyHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeCopyText: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },

  queueSection: { flex: 1, width: '100%', marginBottom: 20 },
  queueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  addSongButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6 },
  addSongText: { fontSize: 13, fontWeight: '700', color: Colors.background, letterSpacing: 0.3 },
  queueEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, borderStyle: 'dashed', minHeight: 120 },
  queueEmptyText: { fontSize: 13, color: Colors.textMuted },
  queueTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  queueIndex: { fontSize: 12, color: Colors.textMuted, width: 18, textAlign: 'center' },
  queueArt: { width: 40, height: 40, borderRadius: 4 },

  separator: { height: 1, backgroundColor: Colors.border, opacity: 0.4 },

  leaveButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 28, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  leaveButtonText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3 },

  /* Spotify connect sheet */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetWrapper: { justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, borderColor: Colors.border, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginVertical: 12 },

  spotifyLogoRow: { alignItems: 'center', marginBottom: 16, marginTop: 8 },
  spotifyIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#0f2a18',
    borderWidth: 1, borderColor: '#1DB954',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  sheetSubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  featureList: { gap: 12, marginBottom: 28, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconWrap: {
    width: 30, height: 30, borderRadius: 6,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 14, color: Colors.text },

  spotifyButton: {
    backgroundColor: '#1DB954', paddingVertical: 15, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  spotifyButtonText: { fontSize: 15, fontWeight: '700', color: '#000', letterSpacing: 0.3 },

  skipButton: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontSize: 13, color: Colors.textMuted },

  /* Search sheet shared */
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  closeButton: { width: 32, height: 32, borderRadius: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  centeredState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.textMuted },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  albumArt: { width: 44, height: 44, borderRadius: 4 },
  albumArtFallback: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  trackArtist: { fontSize: 12, color: Colors.textMuted },
  trackDuration: { fontSize: 12, color: Colors.textMuted, marginRight: 4 },
  addButton: { width: 30, height: 30, borderRadius: 6, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  addButtonDone: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.success },
});