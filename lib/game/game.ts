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
            "You are writing a single, short prompt for a party word-association game. The prompt must be based on the theme: " +
            this.state.theme +
            ". Write ONE clear, concrete question that asks players to list 3 answers. Keep it simple, everyday, and specific enough to spark variety. Do not include examples, explanations, or extra text. Avoid repeating common or generic prompts.";

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

    async evaluateAnswers() {
        const answers = this.state.players.flatMap(player => player.answers || []);
        const prompt = "Players are submitting answers to the prompt: " + this.state.prompt + " Here are all of the answers: " + answers.join(", ") + ". Your job is to cluster all of the answers that match into clusters, create clusters of answers that refer to the same idea. If an answer doesnt match any other answers, dont create a cluster for it. For each cluster, provide a short proper name for the cluster and list the answers that belong to that cluster. Return the response in JSON format as an array of objects with 'clusterName' and 'answers' fields.";

        const raw = await generateCompletion(prompt);
        console.log("Evaluated answers into clusters:", raw);

        let clusters: Array<{ clusterName: string; answers: string[] }> = [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                clusters = parsed;
            }
        } catch (error) {
            console.log("Failed to parse clusters:", error);
            return;
        }

        // tally up player score for each player
        this.state.players.forEach(player => {
            player.score = 0;
            const playerAnswers = player.answers || [];
            for (const answer of playerAnswers) {
                const cluster = clusters.find(c => c.answers.includes(answer));
                if (cluster) {
                    player.score += Math.max(cluster.answers.length, 0);
                }
            }
        });

        this.state.phase = "results";
        this.state.version += 1;
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
