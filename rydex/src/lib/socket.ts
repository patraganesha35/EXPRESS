// import { io, Socket } from "socket.io-client"

// let socket:Socket|null=null

// export const getSocket=()=>{
// if(typeof window === "undefined") return null;
// if(!socket){
//     socket=io(process.env.NEXT_PUBLIC_SOCKET_SERVER)
// }
// return socket
// }

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (typeof window === "undefined") return null;

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER as string, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket Connected:",socket.id );
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket Error:", err.message);
    });
  }

  return socket;
};