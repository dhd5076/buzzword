import { Player, GameState } from './types';

export class Game {
    private state: GameState;

    constructor(roomId: string, theme: string) {
        this.state = {
            roomId,
            phase: 'lobby',
            question: null,
            theme,
            players: [],
            version: 0
        };
    }

    addPlayer(player: Player) {}
    startGame() {}
    advancePhase() {}
    getState(): GameState {
        return this.state;
    }
}