export type Phase = 
    | 'lobby'
    | 'prompt'
    | 'results'
    | 'ended';

export type Player = {
    id: string, //TODO: key? wallet?
    name: string,
    score: number,
    hiveLevel: number,
    isHost: boolean,
    answers: string[] | null;
}

export type GameState = {
    roomId: string,
    phase: Phase,
    prompt: string | null,
    promptHistory: string[],
    theme: string,
    players: Player[],
    timer: Date | null,
    version: number,
    results: {
        clusters: Array<{
            clusterName: string;
            answers: Array<{
                answer: string;
                players: string[];
            }>;
        }>;
        losers: string[];
    } | null
}
