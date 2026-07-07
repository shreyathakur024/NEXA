import express from 'express'
import { getCurrentUser, login, logout, signup, updateProfile } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';
import {upload} from "../lib/multer.js"

const authRouter =express.Router();


authRouter.post('/signup',signup)

authRouter.post('/login',login)

authRouter.post('/logout',logout) 

authRouter.get('/me', protectRoute, getCurrentUser);
authRouter.put("/update-profile", protectRoute, upload.single("profilePic"), updateProfile);

// authRouter.get('/me',authUser,(req,res)=>{
//     res.status(200).json({user:req.user});
// })

export default authRouter