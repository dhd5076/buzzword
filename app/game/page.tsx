"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { nextRound, startGame, submitAnswers } from "../actions";

type GameState = {
  roomId: string;
  phase: string;
  version: number;
  prompt?: string | null;
  players?: Array<{
    id: string;
    name: string;
    hiveLevel: number;
    isHost: boolean;
    profile: string;
  }>;
  results?: {
    clusters: Array<{
      clusterName: string;
      answers: Array<{
        answer: string;
        players: string[];
      }>;
    }>;
    losers: string[];
  } | null;
};

export default function Game() {
  const params = useSearchParams();
  const roomId = params.get("roomId") || null;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [devtoolsNotified, setDevtoolsNotified] = useState(false);

  //So we can participate as the same player on reloads
  //Player ID is stored in localStorage per room
  const storageKey = useMemo(() => {
    return roomId ? `buzzword:player:${roomId}` : null;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !storageKey) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setPlayerId(stored);
  }, [roomId, storageKey]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfiles = async () => {
      try {
        const res = await fetch("/api/profiles");
        if (!res.ok) return;
        const data = (await res.json()) as { profiles?: string[] };
        if (!isMounted) return;
        const list = data.profiles ?? [];
        setProfiles(list);
        if (!selectedProfile && list.length > 0) {
          const defaultProfile = list.includes("Classic Bee") ? "Classic Bee" : list[0];
          setSelectedProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Failed to load profiles:", error);
      }
    };
    fetchProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

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
    // Cause I didn't feel like websockets, this is not scalable, but it'll be fine for a few dozen instances :D
    const intervalId = window.setInterval(fetchState, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [roomId]);

  useEffect(() => {
    if (devtoolsNotified) return;
    if (typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)) {
      return;
    }
    const threshold = 160;
    const intervalId = window.setInterval(() => {
      const widthDelta = Math.abs(window.outerWidth - window.innerWidth);
      const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
      const isOpen = widthDelta > threshold || heightDelta > threshold;
      if (isOpen) {
        setDevtoolsNotified(true);
        window.alert("👀 The hive notices your curiosity. \n Welcome, beekeeper \n Please do not tap the glass.");
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [devtoolsNotified]);

  useEffect(() => {
    if (gameState?.phase !== "prompt") {
      setHasSubmitted(false);
    }
  }, [gameState?.phase]);

  if (!roomId) {
    return <div className="min-h-screen p-6">Missing roomId.</div>;
  }

  const needsJoin = !playerId;
  const currentPlayer = gameState?.players?.find((player) => player.id === playerId) ?? null;
  const isHost = currentPlayer?.isHost ?? false;

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
                  const id =
                    typeof crypto.randomUUID === "function"
                      ? crypto.randomUUID()
                      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                  const res = await fetch(`/api/game/${roomId}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      playerId: id,
                      name,
                      profile: selectedProfile
                    }),
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
              <label className="block text-xs uppercase tracking-[0.3em] text-white/60">
                Avatar
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <img
                    src={
                      selectedProfile
                        ? `/profiles/${encodeURIComponent(selectedProfile)}.png`
                        : "/bee128.png"
                    }
                    alt="Selected avatar"
                    className="h-16 w-16 rounded-full border border-white/20 object-cover"
                  />
                  <span className="text-sm font-semibold text-white">
                    {username.trim() ? username : "USERNAME"}
                  </span>
                </div>
                <select
                  className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white"
                  value={selectedProfile}
                  onChange={(event) => setSelectedProfile(event.target.value)}
                >
                  {profiles.length === 0 ? (
                    <option value="">Loading...</option>
                  ) : (
                    profiles.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))
                  )}
                </select>
              </label>
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
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Room
            </div>
            <div className="text-lg font-semibold">{roomId}</div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20"
            onClick={async () => {
              if (!roomId) return;
              const url = `${window.location.origin}/game?roomId=${roomId}`;
              try {
                await navigator.clipboard.writeText(url);
                setLinkCopied(true);
                window.setTimeout(() => setLinkCopied(false), 2000);
              } catch (error) {
                console.error("Failed to copy game link:", error);
              }
            }}
          >
            {linkCopied ? (
              "Game Link Copied"
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 12a4 4 0 0 1 4-4h4a4 4 0 1 1 0 8h-4" />
                  <path d="M16 12a4 4 0 0 1-4 4H8a4 4 0 1 1 0-8h4" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
        <div className="text-sm text-white/60">Phase: {gameState?.phase.toUpperCase() ?? "..."}</div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-10 md:grid-cols-[1fr_2fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white">
            Prompt
          </div>
          <div className="mt-2 text-xl font-semibold">
            {gameState?.prompt || (gameState?.phase === "lobby" ? "Waiting for the game to start..." : "Generating prompt...")}
          </div>

          {gameState?.phase === "prompt" && !hasSubmitted && (
            <form
              action={submitAnswers}
              className="mt-6 space-y-3"
              onSubmit={() => setHasSubmitted(true)}
            >
              <input name="roomId" type="hidden" value={roomId ?? ""} />
              <input name="playerId" type="hidden" value={playerId ?? ""} />
              <input
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
                placeholder="Answer 1"
                type="text"
                name="answers"
              />
              <input
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
                placeholder="Answer 2"
                type="text"
                name="answers"
              />
              <input
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40"
                placeholder="Answer 3"
                type="text"
                name="answers"
              />
              <button className="w-full rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black">
                Submit
              </button>
            </form>
          )}
          {gameState?.phase === "prompt" && hasSubmitted && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              Answers submitted.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white">
            Board
          </div>
          <div className="mt-4 text-sm text-white/40">
            {gameState?.phase === "ended" ? (
              <div className="space-y-6 text-white/80">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Game Over
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    The hive has spoken.
                  </div>
                  <div className="mt-4 text-sm text-white/70">
                    {gameState.results?.losers?.length
                      ? `Losers: ${gameState.results.losers.join(", ")}`
                      : "Losers: —"}
                  </div>
                </div>
                {gameState.results ? (
                  <div className="space-y-6 text-white/80">
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Clusters
                      </div>
                      {gameState.results.clusters.length === 0 ? (
                        <div className="mt-2 text-sm text-white/50">
                          No matching clusters this round.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-4">
                          {[...gameState.results.clusters]
                            .sort((a, b) => b.answers.length - a.answers.length)
                            .map((cluster) => (
                              <div
                                key={cluster.clusterName}
                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="text-sm font-semibold text-white">
                                    {cluster.clusterName}
                                  </div>
                                  <span className="shrink-0 rounded-full bg-yellow-300/90 px-2.5 py-1 text-xs font-semibold text-black">
                                    +{cluster.answers.length}
                                  </span>
                                </div>
                                <div className="mt-3 space-y-2 text-xs text-white/70">
                                  {cluster.answers.map((answer) => (
                                    <div
                                      key={`${cluster.clusterName}-${answer.answer}`}
                                      className="flex flex-col gap-1 rounded-lg bg-white/5 px-3 py-2"
                                    >
                                      <div className="text-sm text-white">
                                        {answer.answer}
                                      </div>
                                      <div className="text-xs text-white/60">
                                        {answer.players.length > 0
                                          ? `Players: ${answer.players.join(", ")}`
                                          : "Players: —"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : !gameState?.results ? (
              "Results will be shown here after everyone has submitted their answers."
            ) : (
              <div className="space-y-6 text-white/80">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Clusters
                  </div>
                  {gameState.results.clusters.length === 0 ? (
                    <div className="mt-2 text-sm text-white/50">
                      No matching clusters this round.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {[...gameState.results.clusters]
                        .sort((a, b) => b.answers.length - a.answers.length)
                        .map((cluster) => (
                        <div
                          key={cluster.clusterName}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="text-sm font-semibold text-white">
                              {cluster.clusterName}
                            </div>
                            <span className="shrink-0 rounded-full bg-yellow-300/90 px-2.5 py-1 text-xs font-semibold text-black">
                              +{cluster.answers.length}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-white/70">
                            {cluster.answers.map((answer) => (
                              <div
                                key={`${cluster.clusterName}-${answer.answer}`}
                                className="flex flex-col gap-1 rounded-lg bg-white/5 px-3 py-2"
                              >
                                <div className="text-sm text-white">
                                  {answer.answer}
                                </div>
                                <div className="text-xs text-white/60">
                                  {answer.players.length > 0
                                    ? `${answer.players.join(", ")}`
                                    : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Losers
                  </div>
                  <div className="mt-2 text-sm text-white/70">
                    {gameState.results.losers.length > 0
                      ? gameState.results.losers.join(", ")
                      : "No one lost a hive level this round."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-white">
            Players
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {(gameState?.players ?? []).length === 0 ? (
              <div className="text-white/40">No players yet</div>
            ) : (
              [...(gameState?.players ?? [])]
                .sort((a, b) => b.hiveLevel - a.hiveLevel)
                .map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-xl bg-white/20 px-3 py-2 shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative grid h-10 w-10 place-items-center rounded-full backdrop-blur-sm">
                      <img
                        src={
                          player.profile
                            ? `/profiles/${encodeURIComponent(player.profile)}.png`
                            : "/bee128.png"
                        }
                        alt={`${player.name} avatar`}
                        className="h-8 w-8 rounded-full border-2 border-black/20 object-cover bg-black/50"
                      />
                    </div>
                    <span>{player.name}</span>
                  </div>
                  <span className="rounded-full bg-yellow-300/75 px-3 py-1 text font-black text-black backdrop-blur-sm">
                    {player.hiveLevel}
                  </span>
                </div>
              ))
            )}
          </div>
          {gameState?.phase === "lobby" && isHost && (
            <div className="mt-6 space-y-3">
              <div className="text-sm text-white/70">Everyone here?</div>
              <form action={startGame}>
                <input name="roomId" type="hidden" value={roomId ?? ""} />
                <input name="playerId" type="hidden" value={playerId ?? ""} />
                <button className="w-full rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black">
                  Start Game
                </button>
              </form>
            </div>
          )}
          {gameState?.phase === "results" && isHost && (
            <div className="mt-6 space-y-3">
              <div className="text-sm text-white/70">Ready for another prompt?</div>
              <form action={nextRound}>
                <input name="roomId" type="hidden" value={roomId ?? ""} />
                <input name="playerId" type="hidden" value={playerId ?? ""} />
                <button className="w-full rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black">
                  Next Round
                </button>
              </form>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
