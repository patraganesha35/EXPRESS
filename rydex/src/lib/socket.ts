import { io, Socket } from "socket.io-client"

let socket:Socket|null=null

export const getSocket=()=>{
if(typeof window === "undefined") return null;
if(!socket){
    socket=io(process.env.NEXT_PUBLIC_SOCKET_SERVER)
}
return socket
}