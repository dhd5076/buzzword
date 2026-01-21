import generateCompletion from "../llm/vectors";
import { Game } from "./game";

export class GameManager {
  private games = new Map<string, Game>();

  createGame(theme: string): Game {
    console.log("Request received to create game with theme:", theme);
    const roomId = this.generateRoomCode();
    console.log("Room Code: ", roomId);
    const game = new Game(roomId, theme);
    this.games.set(roomId, game);
    return game;
  }

  getGame(roomId: string): Game | null {
    return this.games.get(roomId) || null;
  }

  private generateRoomCode(): string {
    let code = "";
    do {
      code = Math.floor(Math.random() * 100_000_000)
        .toString()
        .padStart(8, "0");
    } while (this.games.has(code));
    return code;
  }
}
// This is absolute trash, forces Next.JS to share some memory globally between workers
// This will absolute cause bugs later, prevents deployment to serverless
// but works for now. Will use something like Redis later.

const globalForGameManager = globalThis as {
  gameManager?: GameManager;
};

const GameManagerInstance =
  globalForGameManager.gameManager ?? new GameManager();

if (!globalForGameManager.gameManager) {
  globalForGameManager.gameManager = GameManagerInstance;
}

export default GameManagerInstance;
