import axios from 'axios';

let cachedToken = null;
let tokenExpirationTime = 0;

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
    const token = await getAccessToken(); // was using undefined `access_token`
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



export const getHostToken = async (code) => {
  const authHeader = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data; 
  } catch (error) {
    console.error('Error getting Host Token:', error.response?.data || error.message);
    throw error;
  }
};export const addToQueue = async (trackUri) => {
  try {
    const token = await getHostToken(); 
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

export const skipToNext = async () => {
  try {
    const token = await getHostToken();
    await axios.post('https://api.spotify.com/v1/me/player/next', null, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return true;
  } catch (error) {
    console.error('Skip Next Error:', error.response?.data || error.message);
    return false;
  }
};

export const getPlaybackState = async () => {
  try {
    const token = await getHostToken();
    const response = await axios.get('https://api.spotify.com/v1/me/player', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.data; 
  } catch (error) {
    console.error('Get Playback State Error:', error.response?.data || error.message);
    return null;
  }
};

export const togglePlayback = async (shouldPlay = true) => {
  const endpoint = shouldPlay ? 'play' : 'pause';
  try {
    const token = await getHostToken();
    await axios.put(`https://api.spotify.com/v1/me/player/${endpoint}`, null, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return true;
  } catch (error) {
    console.error(`Playback ${endpoint} Error:`, error.response?.data || error.message);
    return false;
  }
};