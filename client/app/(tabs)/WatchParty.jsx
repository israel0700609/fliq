import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Colors from "../../constants/Colors";
import { getSocket } from "../../lib/socket.js";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const socket = getSocket(SERVER_URL);

function VotePopup({ vote, onVote, mySocketId }) {
  const slideAnim = useRef(new Animated.Value(120)).current;
  const hasVotedYes = vote?.yesVoters?.includes(mySocketId);
  const hasVotedNo = vote?.noVoters?.includes(mySocketId);

  useEffect(() => {
    if (vote) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      slideAnim.setValue(120);
    }
  }, [vote?.trackUri]);

  if (!vote) return null;

  const total = vote.total || 1;
  const yesWidth = `${Math.round((vote.yesCount / total) * 100)}%`;
  const noWidth = `${Math.round((vote.noCount / total) * 100)}%`;

  return (
    <Animated.View
      style={[styles.votePopup, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.votePopupInner}>
        <View style={styles.votePopupHeader}>
          <View style={styles.voteProposerRow}>
            <Ionicons name="musical-note" size={13} color={Colors.primary} />
            <Text style={styles.voteProposerText}>
              <Text style={styles.voteProposerName}>{vote.proposedBy}</Text>{" "}
              wants to add a song
            </Text>
          </View>
          <View style={styles.voteTimerPill}>
            <Text style={styles.voteTimerText}>{vote.secondsLeft ?? 30}s</Text>
          </View>
        </View>

        <View style={styles.voteTrackRow}>
          {vote.track?.image ? (
            <Image
              source={{ uri: vote.track.image }}
              style={styles.voteAlbumArt}
            />
          ) : (
            <View style={[styles.voteAlbumArt, styles.albumArtFallback]}>
              <Ionicons name="musical-note" size={16} color={Colors.border} />
            </View>
          )}
          <View style={styles.voteTrackInfo}>
            <Text style={styles.voteTrackName} numberOfLines={1}>
              {vote.track?.name}
            </Text>
            <Text style={styles.voteTrackArtist} numberOfLines={1}>
              {vote.track?.artist}
            </Text>
          </View>
          <Text style={styles.voteScore}>
            {vote.yesCount}/{vote.required}
          </Text>
        </View>

        <View style={styles.voteBarBg}>
          <View style={[styles.voteBarYes, { width: yesWidth }]} />
          <View style={[styles.voteBarNo, { width: noWidth }]} />
        </View>

        <View style={styles.voteButtons}>
          <Pressable
            style={[
              styles.voteBtn,
              styles.voteBtnNo,
              hasVotedNo && styles.voteBtnActiveNo,
            ]}
            onPress={() => !hasVotedNo && onVote(vote.trackUri, "no")}
          >
            <Ionicons
              name="close"
              size={20}
              color={hasVotedNo ? "#fff" : Colors.error}
            />
            <Text
              style={[
                styles.voteBtnText,
                { color: hasVotedNo ? "#fff" : Colors.error },
              ]}
            >
              Nope
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.voteBtn,
              styles.voteBtnYes,
              hasVotedYes && styles.voteBtnActiveYes,
            ]}
            onPress={() => !hasVotedYes && onVote(vote.trackUri, "yes")}
          >
            <Ionicons
              name="checkmark"
              size={20}
              color={hasVotedYes ? "#fff" : Colors.success}
            />
            <Text
              style={[
                styles.voteBtnText,
                { color: hasVotedYes ? "#fff" : Colors.success },
              ]}
            >
              Add it
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

function VoteResultToast({ result, onDismiss }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!result) return;
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, [result?.trackUri]);

  if (!result) return null;

  return (
    <Animated.View
      style={[
        styles.resultToast,
        { opacity },
        result.passed ? styles.resultToastSuccess : styles.resultToastFail,
      ]}
    >
      <Ionicons
        name={result.passed ? "checkmark-circle" : "close-circle"}
        size={16}
        color="#fff"
      />
      <Text style={styles.resultToastText}>{result.message}</Text>
    </Animated.View>
  );
}

function SpotifyConnectSheet({ visible, onClose, onConnected, roomId }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (!SERVER_URL) {
        Alert.alert("Spotify", "Missing EXPO_PUBLIC_SERVER_URL");
        return;
      }
      const baseUrl = SERVER_URL.replace(/\/$/, "");
      const redirectUrl = Linking.createURL("spotify-callback");
      const authUrl = `${baseUrl}/api/auth/spotify?roomId=${encodeURIComponent(roomId)}&mobileRedirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
      );
      if (result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);
        if (parsed.queryParams?.success === "true") {
          socket.emit("spotify_connected_alert", { roomId });
          onConnected();
          onClose();
          Alert.alert("Spotify", "Connected successfully");
          return;
        }
        Alert.alert(
          "Spotify",
          "Auth returned without success. Please try again.",
        );
        return;
      }
      Alert.alert("Spotify", `Auth did not complete (${result.type}).`);
    } catch (err) {
      Alert.alert(
        "Spotify",
        "Connection failed. Check server URL and try again.",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.spotifyLogoRow}>
          <View style={styles.spotifyIconWrap}>
            <Ionicons name="musical-notes" size={28} color="#1DB954" />
          </View>
        </View>
        <Text style={styles.sheetTitle}>Connect Spotify</Text>
        <Text style={styles.sheetSubtitle}>
          Sign in so your party can play music. Your account controls playback
          for everyone in the room.
        </Text>
        <View style={styles.featureList}>
          {[
            { icon: "search-outline", label: "Search any song on Spotify" },
            { icon: "people-outline", label: "Room votes on every song" },
            {
              icon: "play-circle-outline",
              label: "Control playback for the room",
            },
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
              <Ionicons
                name="logo-spotify"
                size={18}
                color="#000"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.spotifyButtonText}>
                Continue with Spotify
              </Text>
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

function SearchSheet({ visible, onClose, roomId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [proposedIds, setProposedIds] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    socket.on("searched_track", (tracks) => {
      setResults(tracks);
      setIsSearching(false);
    });
    return () => socket.off("searched_track");
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length === 0) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(
      () => socket.emit("search_track", text.trim()),
      500,
    );
  };

  const handlePropose = (track) => {
    setProposedIds((prev) => [...prev, track.id]);
    socket.emit("propose_song", { track, roomId });
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setProposedIds([]);
    onClose();
  };

  const formatDuration = (ms) => {
    if (!ms) return "";
    return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Propose a song</Text>
              <Text style={styles.sheetSubtitle}>the room votes to add it</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.searchWrapper}>
            <Ionicons
              name="search-outline"
              size={16}
              color={Colors.textMuted}
              style={{ marginRight: 10 }}
            />
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
              <Pressable
                onPress={() => {
                  setQuery("");
                  setResults([]);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={Colors.textMuted}
                />
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
              <Ionicons
                name="musical-notes-outline"
                size={32}
                color={Colors.border}
              />
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
                const proposed = proposedIds.includes(item.id);
                return (
                  <View style={styles.trackRow}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.albumArt}
                      />
                    ) : (
                      <View style={[styles.albumArt, styles.albumArtFallback]}>
                        <Ionicons
                          name="musical-note"
                          size={16}
                          color={Colors.border}
                        />
                      </View>
                    )}
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                    {item.duration_ms && (
                      <Text style={styles.trackDuration}>
                        {formatDuration(item.duration_ms)}
                      </Text>
                    )}
                    <Pressable
                      style={[
                        styles.addButton,
                        proposed && styles.addButtonDone,
                      ]}
                      onPress={() => !proposed && handlePropose(item)}
                      disabled={proposed}
                    >
                      <Ionicons
                        name={proposed ? "checkmark" : "add"}
                        size={16}
                        color={proposed ? Colors.success : Colors.background}
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

export default function WatchParty() {
  const router = useRouter();
  const { roomId, isHost: isHostParam } = useLocalSearchParams();
  const isHost = isHostParam === "true";

  const [copied, setCopied] = useState(false);
  const [memberCount, setMemberCount] = useState(1);
  const [queue, setQueue] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [spotifySheetVisible, setSpotifySheetVisible] = useState(isHost);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [currentVote, setCurrentVote] = useState(null);
  const [voteResult, setVoteResult] = useState(null);
  const voteTimers = useRef({});

  useEffect(() => {
    socket.on("member_count", setMemberCount);
    socket.on("queue_updated", setQueue);
    socket.on("room_closed", () => router.replace("/(tabs)/JoinRoom"));
    socket.on("spotify_connected", () => setSpotifyConnected(true));

    socket.on("vote_started", (data) => {
      const voteWithTimer = { ...data, secondsLeft: 30 };
      setCurrentVote((prev) => prev ?? voteWithTimer);

      let seconds = 30;
      if (voteTimers.current[data.trackUri])
        clearInterval(voteTimers.current[data.trackUri]);
      voteTimers.current[data.trackUri] = setInterval(() => {
        seconds -= 1;
        setCurrentVote((prev) =>
          prev?.trackUri === data.trackUri
            ? { ...prev, secondsLeft: seconds }
            : prev,
        );
        if (seconds <= 0) {
          clearInterval(voteTimers.current[data.trackUri]);
          delete voteTimers.current[data.trackUri];
        }
      }, 1000);
    });

    socket.on("vote_update", (data) => {
      setCurrentVote((prev) =>
        prev?.trackUri === data.trackUri ? { ...prev, ...data } : prev,
      );
    });

    socket.on("vote_result", (data) => {
      clearInterval(voteTimers.current[data.trackUri]);
      delete voteTimers.current[data.trackUri];
      setCurrentVote((prev) =>
        prev?.trackUri === data.trackUri ? null : prev,
      );
      setVoteResult(data);
    });

    return () => {
      socket.off("member_count");
      socket.off("queue_updated");
      socket.off("room_closed");
      socket.off("spotify_connected");
      socket.off("vote_started");
      socket.off("vote_update");
      socket.off("vote_result");
      Object.values(voteTimers.current).forEach(clearInterval);
    };
  }, []);

  const handleCastVote = (trackUri, vote) => {
    socket.emit("cast_vote", { trackUri, roomId, vote });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_room", roomId);
    router.replace("/(tabs)/JoinRoom");
  };

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.filmStrip}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </View>
            <Text style={styles.appName}>FLIQ</Text>
            <View style={styles.filmStrip}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </View>
          </View>
          <View style={styles.memberPill}>
            <Ionicons
              name="people-outline"
              size={13}
              color={Colors.textMuted}
            />
            <Text style={styles.memberText}>{memberCount}</Text>
          </View>
        </View>

        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeLabel}>
            {isHost ? "you created" : "you joined"}
          </Text>
        </View>
        <Text style={styles.roomTitle}>Watch party</Text>
        <Text style={styles.roomSubtitle}>
          {isHost
            ? "Share the code with your friends"
            : "Waiting for the host to start..."}
        </Text>

        {isHost && !spotifySheetVisible && (
          <Pressable
            style={[
              styles.spotifyBanner,
              spotifyConnected && styles.spotifyBannerConnected,
            ]}
            onPress={() => !spotifyConnected && setSpotifySheetVisible(true)}
          >
            <Ionicons
              name={
                spotifyConnected ? "checkmark-circle" : "musical-notes-outline"
              }
              size={15}
              color={spotifyConnected ? "#1DB954" : Colors.textMuted}
            />
            <Text
              style={[
                styles.spotifyBannerText,
                spotifyConnected && { color: "#1DB954" },
              ]}
            >
              {spotifyConnected
                ? "Spotify connected"
                : "Connect Spotify for playback"}
            </Text>
            {!spotifyConnected && (
              <Ionicons
                name="chevron-forward"
                size={13}
                color={Colors.textMuted}
                style={{ marginLeft: "auto" }}
              />
            )}
          </Pressable>
        )}

        <Pressable style={styles.codeBlock} onPress={handleCopyCode}>
          <Text style={styles.codeLabel}>room code</Text>
          <Text style={styles.codeText}>{roomId}</Text>
          <View style={styles.codeCopyHint}>
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={13}
              color={copied ? Colors.success : Colors.textMuted}
            />
            <Text
              style={[styles.codeCopyText, copied && { color: Colors.success }]}
            >
              {copied ? "copied" : "tap to copy"}
            </Text>
          </View>
        </Pressable>

        <View style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <Text style={styles.sectionLabel}>queue</Text>
            <Pressable
              style={styles.addSongButton}
              onPress={() => setSearchVisible(true)}
            >
              <Ionicons name="add" size={15} color={Colors.background} />
              <Text style={styles.addSongText}>Propose song</Text>
            </Pressable>
          </View>

          {queue.length === 0 ? (
            <View style={styles.queueEmpty}>
              <Ionicons
                name="musical-notes-outline"
                size={26}
                color={Colors.border}
              />
              <Text style={styles.queueEmptyText}>
                Propose a song — the room votes!
              </Text>
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
                    <Image
                      source={{ uri: item.image }}
                      style={styles.queueArt}
                    />
                  ) : (
                    <View style={[styles.queueArt, styles.albumArtFallback]}>
                      <Ionicons
                        name="musical-note"
                        size={12}
                        color={Colors.border}
                      />
                    </View>
                  )}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Ionicons
            name="exit-outline"
            size={15}
            color={Colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.leaveButtonText}>
            {isHost ? "Close room" : "Leave room"}
          </Text>
        </TouchableOpacity>
      </View>

      <VotePopup
        vote={currentVote}
        onVote={handleCastVote}
        mySocketId={socket.id}
      />
      <VoteResultToast
        result={voteResult}
        onDismiss={() => setVoteResult(null)}
      />
      <SearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        roomId={roomId}
      />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  filmStrip: { gap: 4 },
  filmHole: {
    width: 5,
    height: 5,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  appName: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: 7,
  },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  memberText: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  roomBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  roomBadgeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  roomTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  roomSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
  spotifyBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  spotifyBannerConnected: { borderColor: "#1DB954" },
  spotifyBannerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  codeBlock: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
    width: "100%",
  },
  codeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  codeText: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: 10,
  },
  codeCopyHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  codeCopyText: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
  queueSection: { flex: 1, width: "100%", marginBottom: 20 },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  addSongButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addSongText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 0.3,
  },
  queueEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderStyle: "dashed",
    minHeight: 120,
  },
  queueEmptyText: { fontSize: 13, color: Colors.textMuted },
  queueTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  queueIndex: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 18,
    textAlign: "center",
  },
  queueArt: { width: 40, height: 40, borderRadius: 4 },
  separator: { height: 1, backgroundColor: Colors.border, opacity: 0.4 },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaveButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Vote popup
  votePopup: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  votePopupInner: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  votePopupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voteProposerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  voteProposerText: { fontSize: 13, color: Colors.textMuted, flex: 1 },
  voteProposerName: { color: Colors.text, fontWeight: "600" },
  voteTimerPill: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  voteTimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  voteTrackRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  voteAlbumArt: { width: 48, height: 48, borderRadius: 6 },
  voteTrackInfo: { flex: 1 },
  voteTrackName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  voteTrackArtist: { fontSize: 12, color: Colors.textMuted },
  voteScore: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  voteBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  voteBarYes: { height: 4, backgroundColor: Colors.success },
  voteBarNo: { height: 4, backgroundColor: Colors.error },
  voteButtons: { flexDirection: "row", gap: 10 },
  voteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  voteBtnYes: { borderColor: Colors.success },
  voteBtnNo: { borderColor: Colors.error },
  voteBtnActiveYes: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  voteBtnActiveNo: { backgroundColor: Colors.error, borderColor: Colors.error },
  voteBtnText: { fontSize: 14, fontWeight: "700" },

  // Result toast
  resultToast: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resultToastSuccess: { backgroundColor: Colors.success },
  resultToastFail: { backgroundColor: Colors.error },
  resultToastText: { flex: 1, fontSize: 13, color: "#fff", fontWeight: "600" },

  // Sheets
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheetWrapper: { justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginVertical: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: { fontSize: 12, color: Colors.textMuted },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  spotifyLogoRow: { alignItems: "center", marginBottom: 16, marginTop: 8 },
  spotifyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#0f2a18",
    borderWidth: 1,
    borderColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },
  featureList: { gap: 12, marginBottom: 28, width: "100%" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 14, color: Colors.text },
  spotifyButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  spotifyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.3,
  },
  skipButton: { alignItems: "center", paddingVertical: 10 },
  skipText: { fontSize: 13, color: Colors.textMuted },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  centeredState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: { fontSize: 13, color: Colors.textMuted },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  albumArt: { width: 44, height: 44, borderRadius: 4 },
  albumArtFallback: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: { flex: 1 },
  trackName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  trackArtist: { fontSize: 12, color: Colors.textMuted },
  trackDuration: { fontSize: 12, color: Colors.textMuted, marginRight: 4 },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDone: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.success,
  },
});
