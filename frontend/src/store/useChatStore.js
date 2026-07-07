import { create } from "zustand";
import { getMessages, sendMessage } from "../service/ChatService";
import { socket } from "../lib/socket";
import {axiosInstance} from "../lib/axios"; // Apna axios instance import karo
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set) => ({
  messages: [],
  users: [], // <--- Yahan add kiya
  isMessagesLoading: false,
  isUsersLoading: false,

  // Sidebar ke liye saare users laane ke liye
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users"); 
      console.log("API Response:", res.data);
      set({ users: res.data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ... baaki messages wala code waisa hi rahega ...
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const messages = await getMessages(userId);
      set({ messages });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

sendMessage: async (userId, messageData) => {
  try {
    const res = await axiosInstance.post(`/messages/send/${userId}`, messageData);
    
    set((state) => ({ 
      messages: [...state.messages, res.data] 
    }));
  } catch (error) {
    throw error;
  }
},

  subscribeToMessages: (selectedUserId) => {
    socket.off("newMessage"); // Remove old listener first
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUserId) return;
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });
  },

  unsubscribeFromMessages: () => {
    socket.off("newMessage");
  },

  searchUsers: async (searchTerm) => {
    const query = searchTerm?.trim() || "";
    set({ isUsersLoading: true });

    try {
      if (!query) {
        const res = await axiosInstance.get("/messages/users");
        set({ users: res.data });
        return;
      }

      const res = await axiosInstance.get(`/messages/search?query=${encodeURIComponent(query)}`);
      set({ users: res.data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },
}));

