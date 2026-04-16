import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// The latest and most active model for new API keys
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const TMDB_GENRES = `
Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80, 
Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36, 
Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749, 
Science Fiction: 878, TV Movie: 10770, Thriller: 53, War: 10752, Western: 37
`;

export const getGenresFromVibe = async (userVibe) => {
    const systemPrompt = `
    You are a movie recommendation engine. The user will give you a "vibe" or mood.
    Match their vibe to 1-3 of the following TMDB genre IDs:
    ${TMDB_GENRES}
    
    User's vibe: "${userVibe}"
    
    IMPORTANT RULES:
    1. Reply ONLY with the genre IDs separated by a comma (e.g., "28,12").
    2. Do NOT include any letters, words, spaces, or explanations. 
    3. If the vibe makes no sense, default to popular genres: "28,35,18".
    `;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Google API Error: ${data.error.message}`);
        }

        if (!data.candidates) {
            console.log("\n⚠️ Raw response from Google:", JSON.stringify(data, null, 2));
            throw new Error("No answer returned from Gemini");
        }

        let mappedGenres = data.candidates[0].content.parts[0].text;
        mappedGenres = mappedGenres.replace(/\s+/g, '').trim();

        // Print in English
        console.log(`✅ Vibe processed: "${userVibe}" -> Genres: ${mappedGenres}`);
        return mappedGenres;

    } catch (error) {
        throw error; 
    }
};

export default { getGenresFromVibe };