import { Router } from "express";
import { getUserById, updateUser, deleteUser } from "../supabase_api/authdb.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/user", async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/user/update", async (req, res) => {
  try {
    console.log("Update request body:", req.body);
    console.log("User from token:", req.user);
    const { first_name, last_name, phone } = req.body;

    if (!first_name || first_name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "First name must be at least 2 characters" });
    }
    if (!last_name || !/^[a-zA-Z0-9]+$/.test(last_name.trim())) {
      return res.status(400).json({ message: "Last name is invalid" });
    }
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits" });
    }

    const updates = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      ...(phone ? { phone: phone.trim() } : {}),
    };

    const updatedUser = await updateUser(req.user.id, updates);
    console.log("Updated user:", updatedUser);
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/user", async (req, res) => {
  try {
    await deleteUser(req.user.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
