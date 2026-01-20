export type Phase = 
    | 'lobby'
    | 'prompt'
    | 'results'
    | 'ended';

export type Player = {
    id: string,
    name: string,
    score: number,
    answers: string[] | null;
}

export type GameState = {
    roomId: string,
    phase: Phase,
    question: string | null,
    theme: string,
    players: Player[],
    version: number
}