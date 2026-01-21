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

const GameManagerInstance = new GameManager();
export default GameManagerInstance;
