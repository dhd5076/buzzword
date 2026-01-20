import { Game } from "./game";

export class GameManager {
  private games = new Map<string, Game>();

  createGame(theme: string): Game {
    const roomId = this.generateRoomCode();
    const game = new Game(roomId, theme);
    this.games.set(roomId, game);
    return game;
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
