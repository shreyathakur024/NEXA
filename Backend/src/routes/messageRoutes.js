import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js"; 
import {getMessages, searchUsers, sendMessage,getUsersForSidebar } from "../controllers/messageController.js"
import { upload } from "../lib/multer.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchUsers);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, upload.single("image"), sendMessage);


export default router;