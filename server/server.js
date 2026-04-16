import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './config/db.js';
import authDB from './supabase_api/authdb.js';
import swipeDB from './supabase_api/swipedb.js' 
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});