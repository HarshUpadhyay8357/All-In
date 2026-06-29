"use client";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PokerBackgroundBlue from "../../components/BackgroundImage";
import '@/app/index.css';

export default function LobbyPage() {
  const { user, accessToken, isLoading } = useAuthStore(); 
  const router = useRouter();
  const [rooms, setrooms] = useState([]);
  const [roomName, setroomName] = useState("");
  const [joinCode, setjoinCode] = useState("");
  const [loading, setloading] = useState(false);

  useEffect(() => {
    if(isLoading) return;

    if (!accessToken) {
      router.push("/login");
    }

    else{
      fetchRooms();
    }
  }, [isLoading, accessToken]);

  const fetchRooms = async () => {
    try {
    const res = await api.get("/api/rooms");
    setrooms(res.data);        
  } catch (err) {
    console.error("Failed to fetch rooms", err);
  }
  };

  const createRoom = async () => {
    if (!roomName.trim()) return;
    setloading(true);
    const res = await api.post("/api/rooms", {
      name: roomName,
      maxPlayers: 6,
      buyIn: 1000,
    });
    router.push(`/room/${res.data.roomId}`);
    setloading(false);
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    router.push(`/room/${joinCode.trim()}`);
  };

  return (
    <>
      <PokerBackgroundBlue />
      <div className="relative z-10 min-h-screen p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 name">Lobby</h1>
          <p className="text-white mb-8 text-xl">Welcome {user?.username},</p>

          {/* create room */}
          <div className="rounded-xl p-6 mb-6 create-room"> 
            <h2 className="text-xl font-bold mb-4">Create Room</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoom();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder='Enter room name'
                onChange={(e) => setroomName(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 font-bold rounded-lg hover:opacity-90 bg-white text-blue-800 text-xl cursor-pointer"
              >
                Create
              </button>
            </form>
          </div>

          {/* join by code */}
          <div className="rounded-xl p-6 mb-6 joinRoom">
            <h2 className="text-xl font-semibold mb-4">Join by Code</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinRoom();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setjoinCode(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-white font-bold rounded-lg hover:opacity-90 text-purple-800 text-xl cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>

          {/* open rooms  */}
          <div className="rounded-xl p-6 bg-white/10 border border-white/10 text-white backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Open Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-gray-400">No open rooms. Create one!</p>
            ) : (
              <div className="flex flex-col gap-3">
                {rooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-lg p-4"
                  >
                    <div>
                      <p className="font-semibold">{room.name}</p>
                      <p className="text-sm text-gray-400">
                        Blinds: {room.blindSmall}/{room.blindBig}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="px-4 py-2 font-bold rounded-lg text-sm cursor-pointer bg-white/5"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
