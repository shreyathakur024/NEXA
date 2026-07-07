import { create } from "zustand";
import { connectSocket, socket } from "../lib/socket";
import { signupUser, loginUser, logoutUser, checkAuthUser } from "../service/authService";
import { updateProfile, getProfile } from "../service/userService";

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,

  // Signup
  signup: async (data) => {
    const res = await signupUser(data);
    set({ authUser: res });
  },

  // Login
  login: async (data) => {
    const res = await loginUser(data);
    set({ authUser: res, isCheckingAuth: false });
    connectSocket(res._id);
  },

  // Logout
  logout: async () => {
    await logoutUser();
    set({ authUser: null, isCheckingAuth: false });

    socket.disconnect();
  },

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const res = await checkAuthUser();
      set({ authUser: res, isCheckingAuth: false });
      if (res?._id) {
        connectSocket(res._id);
      }
    } catch (error) {
      set({ authUser: null, isCheckingAuth: false });
    }
  },

  // 1. Get Profile
  getProfile: async () => {
    try {
      const res = await getProfile();
      set({ authUser: res }); // User data update kiya
    } catch (error) {
      console.log(error);
    }
  },

  // 2. Update Profile
  updateProfile: async (data) => {
    try {
      const res = await updateProfile(data);
      set({ authUser: res }); // Naya updated profile save kiya
    } catch (error) {
      throw error;
    }
  }
}));

