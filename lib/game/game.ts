import generateCompletion from '../llm/vectors';
import { Player, GameState, Phase } from './types';

export class Game {
    private state: GameState;

    constructor(roomId: string, theme: string) {
        this.state = {
            roomId,
            phase: 'lobby',
            prompt: null,
            promptHistory: [],
            timer: null,
            theme,
            players: [],
            version: 0,
            results: null
        };
    }

    addPlayer(id: string, name: string, profile: string) {
        const isHost = this.state.players.length === 0;
        const player: Player = {
            id,
            name,
            score: 0,
            hiveLevel: 4,
            isHost,
            profile,
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
        const previousPrompts =
            this.state.promptHistory.length > 0
                ? "Do not repeat or closely match these previous prompts: " +
                  this.state.promptHistory.join(" | ") +
                  ". "
                : "";
        const prompt =
            "You are writing a single, short prompt for a party word-association game. The prompt must be based on the theme: " +
            this.state.theme +
            ". " +
            previousPrompts +
            "Write ONE clear, concrete question that asks players to list 3 answers. Keep it simple, everyday, and specific enough to spark variety. Do not include examples, explanations, or extra text. Avoid repeating common or generic prompts.";

        const response = await generateCompletion(prompt);
        this.state.prompt = response;
        this.state.promptHistory.push(response);
        console.log("Generated prompt:", this.state.prompt);
    }

    async startGame(playerId: string) {
        if (this.state.phase !== "lobby") return;
        const player = this.state.players.find(p => p.id === playerId);
        if (!player?.isHost) return;
        this.state.phase = "prompt";
        this.state.results = null;

        await this.setPrompt();

        this.state.version += 1;
    }

    async nextRound(playerId: string) {
        if (this.state.phase !== "results") return;
        const player = this.state.players.find(p => p.id === playerId);
        if (!player?.isHost) return;
        this.state.phase = "prompt";
        this.state.results = null;

        await this.setPrompt();

        this.state.version += 1;
    }

    async evaluateAnswers() {
        const answers = this.state.players.flatMap(player => player.answers || []);
        //TODO: answers.join needs proper escaping to avoid injection issues. Fine for now
        const prompt = "Players are submitting answers to the prompt: " + this.state.prompt + " Here are all of the answers: " + answers.join(", ") + ". Your job is to cluster all of the answers that match into clusters, create clusters of answers that refer to the same idea. Each answer can appear in at most one cluster; do not reuse an answer across multiple clusters. If an answer doesnt match any other answers, dont create a cluster for it. For each cluster, provide a short proper name for the cluster and list the answers that belong to that cluster. Return the response in JSON format as an array of objects with 'clusterName' and 'answers' fields.";

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
            //search clusters of answers to see if any of the player's answers are in a cluster, award points based on cluster size.
            for (const answer of playerAnswers) {
                const cluster = clusters.find(c => c.answers.includes(answer));
                if (cluster) {
                    player.score += cluster.answers.length
                }
            }
        });

        const answerToPlayers = new Map<string, string[]>();
        this.state.players.forEach(player => {
            (player.answers || []).forEach(answer => {
                const existing = answerToPlayers.get(answer) || [];
                existing.push(player.name);
                answerToPlayers.set(answer, existing);
            });
        });

        const resultsClusters = clusters.map(cluster => ({
            clusterName: cluster.clusterName,
            answers: cluster.answers.map(answer => ({
                answer,
                players: answerToPlayers.get(answer) || []
            }))
        }));

        this.state.phase = "results";
        this.state.version += 1;

        //pick the player or players with the lowest score and drop their hive level by 1
        const lowestScore = Math.min(...this.state.players.map(p => p.score));
        const losers: string[] = [];

        let shouldEndGame = false;
        this.state.players.forEach(player => {
            if (player.score === lowestScore) {
                player.hiveLevel -= 1;
                losers.push(player.name);
                if(player.hiveLevel < 1) {
                    shouldEndGame = true; // wait until after scoring to end the game
                }
            }
        });

        this.state.results = {
            clusters: resultsClusters,
            losers
        };

        if (shouldEndGame) {
            this.endGame();
        }

        this.resetAnswers();
    }
    endGame() {
        //Debating making this jump to a end screen instead of showing on the same page, we can redirect to a different URL with final stats or something
        console.log("Game has ended.");
        this.state.phase = "ended";
        this.state.version += 1;
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
