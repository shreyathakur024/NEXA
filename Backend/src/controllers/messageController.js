import { Message}  from "../models/message.js";
import  {User}  from "../models/User.js";
import { getReceiverSocketId,userSocketMap } from "../lib/utils.js";
import { getIo } from "../lib/socket.js";
import path from "path";
import fs from "fs";

const buildFileUrl = (req, filePath) => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const host = req.get("host") || "localhost:5000";
  const protocol = req.protocol || "http";
  return `${protocol}://${host}/${filePath.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const imageFile = req.file;

    let imageUrl = "";
    if (imageFile) {
      const relativePath = `uploads/${imageFile.filename}`;
      imageUrl = buildFileUrl(req, relativePath);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const io = getIo();
    const receiverSocketId = getReceiverSocketId(receiverId); // Ek helper function banayenge
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params; // Jis user se chat karni hai
    const senderId = req.user._id; // Login wala user

    // MongoDB se wo saare messages dhundo jahan:
    // Ya toh humne bheje hain (senderId) ya humein mile hain (receiverId)
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const serializeUser = (user) => ({
  ...user.toObject(),
  fullName: user.fullName || user.name || "",
});

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers.map(serializeUser));
  } catch (error) {
    console.log("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const query = req.query.query?.trim() || "";
    const loggedInUserId = req.user._id;

    const searchCriteria = {
      _id: { $ne: loggedInUserId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    };

    const users = await User.find(query ? searchCriteria : { _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(users.map(serializeUser));
  } catch (error) {
    res.status(500).json({ message: "Search error" });
  }
};