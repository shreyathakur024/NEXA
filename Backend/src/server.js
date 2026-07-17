import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js';
import cookieParser from "cookie-parser";
import authRouter from './routes/authRoutes.js';
import cors from "cors";
import { createServer } from "http";
import {Server} from "socket.io"; 
import messageRoutes from './routes/messageRoutes.js'
import { userSocketMap } from './lib/utils.js';
import {setIo} from "./lib/socket.js"
import path from 'path'
import fs from 'fs'

dotenv.config();

const app = express();
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });


const httpServer= createServer(app);

const PORT = process.env.PORT || 5000;

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "https://nexa-bysk.vercel.app"];
export const io = new Server(httpServer,{
    cors:{
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
                callback(null, origin || true);
                return;
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods:['GET','POST'],
        credentials: true,
    }
});
setIo(io);

// Socket connection listener
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
  const userId = socket.handshake.query.userId; // Frontend se aayi ID
  
  if (userId) userSocketMap[userId] = socket.id;

  // Online users ka status sabko bhej do
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("callUser", (data) => {
    const targetSocketId = userSocketMap[data.userToCall];
    if (targetSocketId) {
      io.to(targetSocketId).emit("callUser", {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        callType: data.callType,
      });
    }
  });

  // Jab user disconnect ho
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("answerCall", (data) => {
  const targetSocketId = userSocketMap[data.to];
  if (targetSocketId) {
    io.to(targetSocketId).emit("callAccepted", data.signal);
  }
});

  socket.on("endCall", (data) => {
    const targetSocketId = userSocketMap[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("endCall");
    }
  });

// ICE Candidate exchange (P2P connection establish karne ke liye zaruri)
socket.on("iceCandidate", (data) => {
  const targetSocketId = userSocketMap[data.to];
  if (targetSocketId) {
    io.to(targetSocketId).emit("iceCandidate", data.candidate);
  }
});

});

app.get('/', (req, res)=>{
  res.send("Welcome")
})

// middleware
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  exposedHeaders: ["X-Auth-Token", "x-auth-token"]
}));
app.use("/api/auth",authRouter)
app.use("/api/messages",messageRoutes);


const tryListen = (port) => new Promise((resolve, reject) => {
  const onError = (err) => reject(err);
  httpServer.once('error', onError);
  httpServer.listen(port, () => {
    httpServer.removeListener('error', onError);
    resolve(port);
  });
});

const start = async () => {
  try {
    await connectDB();

    // Try binding to PORT, if in use try subsequent ports up to +10
    let basePort = Number(PORT);
    const maxAttempts = 10;
    for (let i = 0; i <= maxAttempts; i++) {
      try {
        const boundPort = await tryListen(basePort + i);
        console.log(`server is running on PORT ${boundPort}`);
        return;
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`Port ${basePort + i} in use, trying ${basePort + i + 1}...`);
          // continue loop to try next port
        } else {
          console.error('Server failed to start:', err);
          process.exit(1);
        }
      }
    }

    console.error(`Could not bind to ports ${port}-${port + maxAttempts}. Exiting.`);
    process.exit(1);
  } catch (err) {
    console.error('Failed to connect DB or start server:', err);
    process.exit(1);
  }
};

start();