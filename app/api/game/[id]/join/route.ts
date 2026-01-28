import { NextResponse } from "next/server";
import GameManagerInstance from "@/lib/game/manager";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

//we should probably either move all game logic to routes instead of server actions or vice versa for consistency, but for now this works

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as {
    playerId?: string;
    name?: string;
    profile?: string;
  };

  if (!body.playerId || !body.name) {
    return NextResponse.json({ error: "Missing player data" }, { status: 400 });
  }

  const game = GameManagerInstance.getGame(id);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const profile = body.profile?.trim() || "Classic Bee";
  game.addPlayer(body.playerId, body.name, profile);
  return NextResponse.json(game.getState());
}
