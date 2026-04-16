import 'dotenv/config'; 

import { discoverMovies } from "./Services/tmdbService.js";
import { getGenresFromVibe } from "./Services/vibeService.js";

async function runBackendTest() {
    console.log("🚀 Starting backend test...");

    console.log("🔑 TMDB Key loaded:", process.env.TMDB_API_KEY ? "YES" : "NO");
    console.log("🔑 GEMINI Key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

    if (!process.env.TMDB_API_KEY || !process.env.GEMINI_API_KEY) {
        console.error("❌ Missing keys! Make sure your .env file is properly configured.");
        return;
    }

    const myVibe = "I want a dark, scary horror movie that will give me nightmares";
    
    try {
        console.log(`\n🤖 1. Sending vibe to Gemini: "${myVibe}"`);
        const genres = await getGenresFromVibe(myVibe);
        console.log(`✅ Gemini's response (Genre IDs): ${genres}`);
        
        console.log(`\n🎬 2. Sending request to TMDB for movies in these genres...`);
        const movies = await discoverMovies(genres);
        
        console.log(`✅ TMDB returned ${movies.length} movies! Here are the top 3:`);
        
        movies.forEach((movie, index) => {
            console.log(`   ${index + 1}. ${movie.title} (⭐ ${movie.vote_average})`);
            console.log(`      Overview: ${movie.overview}`);
        });

    } catch (err) {
        console.error("\n❌ Error during the test:", err.message);
    }
}

runBackendTest();