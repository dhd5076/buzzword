import generateCompletion from '../llm/vectors';
import { Player, GameState, Phase } from './types';

export class Game {
    private state: GameState;

    constructor(roomId: string, theme: string) {
        this.state = {
            roomId,
            phase: 'lobby',
            prompt: null,
            timer: null,
            theme,
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
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;
        player.answers = answers;
        this.state.version += 1;
        console.log(`Player ${playerId} submitted answers:`, answers);

        const allAnswered = this.state.players.every(
            p => (p.answers?.length ?? 0) > 0
        );
        if (allAnswered) {
            this.evaluateAnswers();
        }
    }

    async setPrompt() {
        const prompt =
            "This is a game of Hive Mind, you need to generate a prompt based on the theme: " +
            this.state.theme +
            " You should respond with a question that is open ended and can have multiple answers. The question should not be too specific or too broad. It should be something that can be answered in a few words or a short sentence. The question should not contain any buzzwords or jargon. The question should be engaging and interesting. The question should mention or ask players to give 3 answers or list 3 things.";

        const response = await generateCompletion(prompt);
        this.state.prompt = response;
        console.log("Generated prompt:", this.state.prompt);
    }

    async startGame() {
        if (this.state.phase !== "lobby") return;
        this.state.phase = "prompt";

        await this.setPrompt();

        this.state.version += 1;
    }

    evaluateAnswers() {
        throw new Error("Method not implemented.");
        this.resetAnswers();
    }

    endGame() {
        throw new Error("Method not implemented.");
    }

    resetGame() {
        throw new Error("Method not implemented.");
    }

    getState(): GameState {
        if (this.state.phase !== "prompt") {
            return this.state;
        }

        return {
            ...this.state,
            players: this.state.players.map(player => ({
                ...player,
                answers: null
            }))
        };
    }

    private resetAnswers() {
        this.state.players = this.state.players.map(player => ({
            ...player,
            answers: null
        }));
    }
}
