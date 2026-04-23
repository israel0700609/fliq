import axios from 'axios';
import { rooms } from '../RoomState.js';
const cleanEnv = (value = '') =>
  String(value).trim().replace(/^['"]|['"]$/g, '').replace(/;$/, '');


let cachedToken = null;
let tokenExpirationTime = 0;

export const roomTokens = {};

/*
rooms.set(roomId, {
    hostSocketId: 'socket_id_of_host',
    spotifyToken: '...', // ה-Access Token של המארח (אופציונלי לשמור כאן)
    members: new Map([
        ['socket_id_1', { username: 'User1' }],
        ['socket_id_2', { username: 'User2' }]
    ])
});
*/
export const saveTokenForRoom = (roomId, tokenData) => {
    if (!rooms.has(roomId)) {
        console.log('Error: Room does not exist');
        return;
    }

    const roomToken = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + (tokenData.expires_in * 1000) 
    };

    const room = rooms.get(roomId);
    
    room.spotifyToken = roomToken; 

    console.log(`Spotify token saved for room: ${roomId}`);
};

export const getSavedTokenForRoom = (roomId) => {
  const room = rooms.get(roomId);

  if (!room) {
    console.log('Error: Room does not exist');
    return null;
  }
  console.log(`Spotify token saved for room: ${roomId}`);

  return room.spotifyToken?.access_token || null;
};


export const getAccessToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpirationTime - 10000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    cachedToken = response.data.access_token;
    tokenExpirationTime = now + (response.data.expires_in * 1000);
    return cachedToken;
  } catch (error) {
    console.error('Error fetching Spotify token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify');
  }
};

export const searchTracks = async (query) => {
  try {
    const token = await getAccessToken(); 
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { q: query, type: 'track', limit: 10 },
    });
    return response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      image: track.album.images[0]?.url,
      duration_ms: track.duration_ms,
      uri: track.uri,
    }));
  } catch (error) {
    console.error('Search Error:', error.response?.data || error.message);
    return [];
  }
};

export const getTrackDetails = async (trackId) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const track = response.data;
    return {
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url,
      duration_ms: track.duration_ms,
      uri: track.uri,
    };
  } catch (error) {
    console.error(`Error fetching track ${trackId}:`, error.response?.data || error.message);
    return null;
  }
};

export const getRecommendations = async (trackId) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { seed_tracks: trackId, limit: 10 },
    });
    return response.data.tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      image: track.album.images[0]?.url,
      duration_ms: track.duration_ms,
      uri: track.uri,
    }));
  } catch (error) {
    console.error('Recommendations Error:', error.response?.data || error.message);
    return [];
  }
};


export const getHostToken = async (roomId, code, redirectUriOverride = '') => {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room does not exist');
  if (room.spotifyToken) return room.spotifyToken;

  const clientId = cleanEnv(process.env.SPOTIFY_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.SPOTIFY_CLIENT_SECRET);
  const redirectUri = cleanEnv(redirectUriOverride || process.env.SPOTIFY_REDIRECT_URI);
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',     
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log('Host token fetched successfully');
    saveTokenForRoom(roomId, response.data); 
    
    return response.data; 
  } catch (error) {
    console.error('Error getting Host Token:', error.response?.data || error.message);
    throw error;
  }
};

export const addToQueue = async (trackUri, roomId) => {
  try {
    const token = getSavedTokenForRoom(roomId);
    if (!token) throw new Error('No valid token found for this room. Host needs to re-authenticate.');

    await axios.post(
      'https://api.spotify.com/v1/me/player/queue',
      null, 
      {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { uri: trackUri },
      }
    );
    return { success: true };
  } catch (error) {
    console.error('Add to Queue Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const skipToNext = async (roomId) => {
  try {
    const token = getSavedTokenForRoom(roomId);
    if (!token) throw new Error('No valid token found for this room.');

    await axios.post('https://api.spotify.com/v1/me/player/next', null, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return true;
  } catch (error) {
    console.error('Skip Next Error:', error.response?.data || error.message);
    return false;
  }
};

export const getPlaybackState = async (roomId) => {
  try {
    const token = getSavedTokenForRoom(roomId);
    if (!token) throw new Error('No valid token found for this room.');

    const response = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data; 
  } catch (error) {
    console.error('Get Playback State Error:', error.response?.data || error.message);
    return null;
  }
};

export const togglePlayback = async (shouldPlay = true, roomId) => {
  const endpoint = shouldPlay ? 'play' : 'pause';
  try {
    const token = getSavedTokenForRoom(roomId);
    if (!token) throw new Error('No valid token found for this room.');

    await axios.put(`https://api.spotify.com/v1/me/player/${endpoint}`, null, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return true;
  } catch (error) {
    console.error(`Playback ${endpoint} Error:`, error.response?.data || error.message);
    return false;
  }
};