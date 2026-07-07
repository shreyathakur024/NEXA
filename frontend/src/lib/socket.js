import { io } from "socket.io-client";

const URL = "http://localhost:5004";

// Yahan socket initialize karo, lekin connect mat karo
export const socket = io(URL, {
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