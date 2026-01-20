import { Player, GameState, Phase } from './types';

export class Game {
    private state: GameState;

    constructor(roomId: string, theme: string) {
        this.state = {
            roomId,
            phase: 'lobby',
            prompt: null,
            timer: null,
            theme: theme,
            players: [],
            version: 0
        };
    }

    addPlayer(id: string, name: string) {
        const player: Player = {
            id,
            name,
            score: 0,
            hiveLevel: 4,
            answers: null
        };
        this.state.players.push(player);
        this.state.version += 1;
    }

    removePlayer(id: string) {
        this.state.players = this.state.players.filter(player => player.id !== id);
        this.state.version += 1;
    }

    handleSubmitAnswers(playerId: string, answers: string[]) {
        throw new Error("Method not implemented.");
    }

    evaluateAnswers() {
        throw new Error("Method not implemented.");
    }

    endGame() {
        throw new Error("Method not implemented.");
    }

    resetGame() {
        throw new Error("Method not implemented.");
    }

    getState(): GameState {
        return this.state;
    }
}
