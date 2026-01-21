import { NextResponse } from "next/server";
import GameManagerInstance from "@/lib/game/manager";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const game = GameManagerInstance.getGame(params.id);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json(game.getState());
}
