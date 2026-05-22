// Trigger nodemon restart
import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import axios from "axios";

dotenv.config();

import mongoose from "mongoose";
import User from "./models/user.models.js";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("✅ Connected to MongoDB");
};

await connectDB();

const app = express();
app.use(express.json());

// const corsOptions = {
//   origin: process.env.NEXT_BASE_URL || "*",
//   methods: ["GET", "POST"],
// };

const corsOptions = {
  origin: ["https://express-iota-livid.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true,
};

import cors from "cors";
app.use(cors(corsOptions));

const server = http.createServer(app);
const port = process.env.PORT || 5000;

// const io = new Server(server, {
//   cors: corsOptions
// });

const io = new Server(server, {
  cors: {
    origin: ["https://express-iota-livid.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// app.get("/", (req, res) => {
//   res.send("Socket Server is Running");
// });
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Socket Server is Running",
  });
});

app.post("/emit", async (req, res) => {
  const { userId, event, data } = req.body;

  try {
    const user = await User.findById(userId);

    if (user?.socketId) {
      io.to(user.socketId).emit(event, data);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post("/emit-room", async (req, res) => {
  const { roomId, event, data } = req.body;

  try {
    console.log(`[EMIT-ROOM] ${roomId} -> ${event}`, data);
    io.to(roomId).emit(event, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

io.on("connection", (socket) => {
  socket.on("identity", async (userId) => {
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, {
      socketId: socket.id,
      isOnline: true,
    });
  });

  socket.on("join-booking", (bookingId) => {
    socket.join(`booking-${bookingId}`);
  });

  socket.on("driver-location-update", (data) => {
    io.to(`booking-${data.bookingId}`).emit("driver-location", {
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status || "arriving",
    });
  });

  socket.on("chat-message", (msg) => {
    io.to(`booking-${msg.rideId}`).emit("chat-message", msg);
  });

  socket.on("update-location", async ({ latitude, longitude }) => {
    if (!socket.userId) return;
    await User.findByIdAndUpdate(socket.userId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });
  });

  socket.on("disconnect", async () => {
    if (!socket.userId) return;
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      socketId: null,
    });
  });
});

// if (process.env.NODE_ENV !== "production") {
//   server.listen(port, () => {
//     console.log("server started at", port);
//   });
// }

server.listen(port, () => {
  console.log("server started at", port);
});

export default app;
