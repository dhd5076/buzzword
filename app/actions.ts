"use server";

import { redirect } from "next/navigation";
import GameManagerInstance from "@/lib/game/manager";

export async function createGame(formData: FormData) {
  const theme = String(formData.get("theme") || "").trim();
  const game = GameManagerInstance.createGame(theme);
  redirect(`/game?roomId=${game.getState().roomId}`);
}

export async function startGame(formData: FormData) {
  const roomId = String(formData.get("roomId") || "").trim();
  if (!roomId) return;

  const game = GameManagerInstance.getGame(roomId);
  if (!game) return;

  await game.startGame();
}

export async function submitAnswers(formData: FormData) {
  const roomId = String(formData.get("roomId") || "").trim();
  const playerId = String(formData.get("playerId") || "").trim();
  if (!roomId || !playerId) return;

  const answers = formData
    .getAll("answers")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  const game = GameManagerInstance.getGame(roomId);
  if (!game) return;

  game.handleSubmitAnswers(playerId, answers);
}
