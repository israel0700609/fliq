import { Router } from "express";
import { getUserById, updateUser } from "../supabase_api/authdb.js";
import {auth} from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/user', async (req, res) => {
    try {
        const { data: user, error } = await getUserById(req.user.id);

        if (error || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/user', async (req, res) => {
    try {
        const updates = req.body;
        
        delete updates.id;
        delete updates._id;

        const { data: updatedUser, error } = await updateUser({ ...updates, id: req.user.id });

        if (error) throw error;

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
