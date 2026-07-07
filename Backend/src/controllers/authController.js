import jwt from 'jsonwebtoken'
import { User } from '../models/User.js' 
import bcrypt from 'bcryptjs'
import path from 'path'


// jwt and cookies
const generateToken=(userId,res)=>{
    const token=jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"7d"});
    res.cookie("jwt",token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true,
        sameSite:"none",
        secure:false,
    });
    // Also send token in header for header-based auth
    res.set("X-Auth-Token", token);
    return token;
};

const buildFileUrl = (req, filePath) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    return `${protocol}://${host}/${filePath.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// signup
export const signup = async(req,res)=>{
    const {name,email,password}= req.body;
    try {
        if(!name || !email || !password) return res.status(400).json({message:"All fields required"})

        const existingUser = await User.findOne({email})
        if(existingUser) return res.status(400).json({message:"User already exists"})
        
        const hashedPassword = await bcrypt.hash(password,10);

        // Avatar
        const idx = Math.floor(Math.random() * 1000) + 1;
        // Fix: Backticks (`) aur sahi syntax
        const avatar = `https://api.dicebear.com/10.x/avataaars/svg?seed=${idx}&skinColor=614335,ffdbb4,fd9841`;

        const newUser = new User({ name, email, password: hashedPassword, profilePic: avatar });

        if(newUser){
            generateToken(newUser._id,res);
            await newUser.save();
            res.status(201).json({ _id: newUser._id, name, email, profilePic: newUser.profilePic });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// login
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({email} );
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    generateToken(user._id, res);
    res.status(200).json({ _id: user._id, name: user.name, profilePic: user.profilePic });
  } catch (error) {
    console.log("Login Error Details:", error);
    res.status(500).json({ message: error.message });
  }
};

// logout
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio } = req.body;
    const profilePicFile = req.file;

    const update = {};
    if (name) update.name = name;
    if (bio !== undefined) update.bio = bio;

    if (profilePicFile) {
      update.profilePic = buildFileUrl(req, `uploads/${profilePicFile.filename}`);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 0, httpOnly: true, sameSite: "none", secure: false });
  res.status(200).json({ message: "Logged out" });
};