import { Router } from "express";
import jwt from 'jsonwebtoken';
import { isUserExists, registerNewUser, login,deleteUser,updateUser, getUserById } from "../supabase_api/authdb.js";

const router = Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

router.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, email, password, phone, birthday } = req.body;

        if (!firstname || !lastname || !email || !password || !phone || !birthday) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userExists = await isUserExists(email);
        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const newUser = await registerNewUser(
            email, 
            password, 
            firstname, 
            lastname,  
            phone, 
            birthday
        );
        
        const user = newUser.user;

        res.status(201).json({
            id: user.id,
            email: user.email,
            token: generateToken(user.id)
        });
    } catch (error) {
        console.error("Register Router Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }

        const user = await login(email, password);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/user/:id', async (req, res) => {
    try {
        const { data: user, error } = getUserById(req.params.id);

        if (error || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.patch('/user/:id', async (req, res) => {
    try {
        const updates = req.body;
        
        delete updates.id;
        delete updates._id;

        const { data: updatedUser, error } = updateUser(updates);

        if (error) throw error;

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/user/:id', async (req, res) => {
    try {
        deleteUser(req.params.id);
        res.status(200).json({ message: 'User and related data deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/spotify', (req, res) => {
  const { roomId } = req.query;
  const scope = 'user-modify-playback-state user-read-playback-state';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: roomId, 
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

export default router;