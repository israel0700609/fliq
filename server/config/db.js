import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials!");
}
const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        
        if (error && error.code !== 'PGRST116') { 
            throw error;
        }
        
        console.log(`Supabase is ready to use! URL: ${supabaseUrl}`);
    } catch (error) {
        console.error(`Error connecting to Supabase: ${error.message}`);
        console.warn(`Supabase connection failed. Server will start but database operations may fail.`);
    }
}

export {supabase,connectDB};
