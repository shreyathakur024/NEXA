import { io } from "socket.io-client";

let apiBaseUrl = import.meta.env.VITE_API_URL || "https://nexa-hj2s.onrender.com/api";

// Ensure baseURL ends with /api
if (apiBaseUrl) {
    const trimmed = apiBaseUrl.replace(/\/+$/, "");
    if (!trimmed.endsWith("/api")) {
        apiBaseUrl = `${trimmed}/api`;
    } else {
        apiBaseUrl = trimmed;
    }
}

// Socket connects to the root domain of the backend (remove /api)
const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

// Yahan socket initialize karo, lekin connect mat karo
export const socket = io(socketUrl, {
  autoConnect: false, 
});

// Helper function login ke baad call karne ke liye
export const connectSocket = (userId) => {
  socket.io.opts.query = { userId };
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};