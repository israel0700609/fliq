import dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export const getImageUrl = (path) => {
    if (!path) return null; 
    return `${TMDB_IMAGE_BASE_URL}${path}`;
};

export const discoverMovies = async (genreIds = null, page = 1) => {
    try {
        let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}`;

        if (genreIds) {
            url += `&with_genres=${genreIds}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.status_message || 'Failed to fetch movies from TMDB');
        }

        return data.results; 
    } catch (error) {
        console.error("TMDB Fetch Error:", error.message);
        return []; 
    }
};

export const getMovieVideos = async (movieId) => {
    try {
        const url = `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(url);
        const data = await response.json();
        
        const trailers = data.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');
        return trailers;
    } catch (error) {
        console.error("TMDB Video Fetch Error:", error.message);
        return [];
    }
};

export default { discoverMovies, getMovieVideos, getImageUrl };