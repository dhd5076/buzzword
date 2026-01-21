"use server";

import { redirect } from "next/navigation";
import GameManagerInstance from "@/lib/game/manager";

export async function createGame(formData: FormData) {
  const theme = String(formData.get("theme") || "").trim();
  const game = GameManagerInstance.createGame(theme);
  redirect(`/game?roomId=${game.getState().roomId}`);
}
