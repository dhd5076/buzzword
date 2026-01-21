"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type GameState = {
  roomId: string;
  phase: string;
  version: number;
};

export default function Game() {
  const params = useSearchParams();
  const roomId = params.get("id") || null;
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    const fetchState = async () => {
      const res = await fetch(`/api/game/${roomId}`);
      if (!res.ok) return;
      const data = (await res.json()) as GameState;
      if (isMounted) setGameState(data);
    };

    fetchState();
    const intervalId = window.setInterval(fetchState, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [roomId]);

  if (!roomId) {
    return <div className="min-h-screen p-6">Missing roomId.</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="text-lg font-semibold">Game Page</div>
      <div className="mt-2 text-sm opacity-70">Room: {roomId}</div>
      <pre className="mt-6 rounded-lg bg-black/10 p-4 text-sm">
        {gameState ? JSON.stringify(gameState, null, 2) : "Loading game state..."}
      </pre>
    </div>
  );
}
