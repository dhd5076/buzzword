"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { startGame } from "../actions";

type GameState = {
  roomId: string;
  phase: string;
  version: number;
  prompt?: string | null;
  players?: Array<{ id: string; name: string }>;
};

export default function Game() {
  const params = useSearchParams();
  const roomId = params.get("roomId") || null;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const storageKey = useMemo(() => {
    return roomId ? `buzzword:player:${roomId}` : null;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !storageKey) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setPlayerId(stored);
  }, [roomId, storageKey]);

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

  const needsJoin = !playerId;

  return (
    <div className="min-h-screen bg-[#11110f]/80 text-white">
      {needsJoin && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a16] p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Join Room
            </div>
            <div className="mt-2 text-xl font-semibold">Pick a username</div>
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!roomId || !storageKey) return;
                const name = username.trim();
                if (!name) return;
                setIsJoining(true);
                try {
                  const id = crypto.randomUUID();
                  const res = await fetch(`/api/game/${roomId}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playerId: id, name }),
                  });
                  if (!res.ok) return;
                  window.localStorage.setItem(storageKey, id);
                  setPlayerId(id);
                } finally {
                  setIsJoining(false);
                }
              }}
            >
              <input
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
                placeholder="Your name"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <button
                className="w-full rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black disabled:opacity-70"
                type="submit"
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Game"}
              </button>
            </form>
          </div>
        </div>
      )}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            Room
          </div>
          <div className="text-lg font-semibold">{roomId}</div>
        </div>
        <div className="text-sm text-white/60">Phase: {gameState?.phase ?? "..."}</div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-10 md:grid-cols-[1fr_2fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            Prompt
          </div>
          <div className="mt-2 text-xl font-semibold">
            {gameState?.prompt ?? "Waiting for prompt..."}
          </div>

          <div className="mt-6 space-y-3">
            <input
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
              placeholder="Answer 1"
              type="text"
            />
            <input
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
              placeholder="Answer 2"
              type="text"
            />
            <input
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
              placeholder="Answer 3"
              type="text"
            />
            <button className="w-full rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black">
              Submit
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            Board
          </div>
          <div className="mt-4 text-sm text-white/40">
            Waiting for round results...
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            Players
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {(gameState?.players ?? []).length === 0 ? (
              <div className="text-white/40">No players yet</div>
            ) : (
              gameState?.players?.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2"
                >
                  <span>{player.name}</span>
                  <span className="text-xs text-white/50">Ready</span>
                </div>
              ))
            )}
          </div>
          {gameState?.phase === "lobby" && (
            <div className="mt-6 space-y-3">
              <div className="text-sm text-white/70">Everyone here?</div>
              <form action={startGame}>
                <input name="roomId" type="hidden" value={roomId ?? ""} />
                <button className="w-full rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black">
                  Start Game
                </button>
              </form>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
