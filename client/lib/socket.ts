import { useAuthStore } from "@/lib/auth-store";
import { io, Socket } from "socket.io-client";

let socket: Socket|null = null;

export function getSocket():Socket{
    if(!socket){
        const {accessToken} = useAuthStore.getState();
        socket=io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
            auth:{token:accessToken},
            autoConnect:false
        });
    }
    return socket;
} 

export function connectSocket(){
    const s = getSocket();
    if(!s.connected) s.connect();
    return s;
}

export function disconnectSocket(){
    if(socket?.connected) socket.disconnect();
}