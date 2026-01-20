export type Phase = 
    | 'lobby'
    | 'prompt'
    | 'results'
    | 'ended';

export type Player = {
    id: string,
    name: string,
    score: number,
    hiveLevel: number,
    answers: string[] | null;
}

export type GameState = {
    roomId: string,
    phase: Phase,
    prompt: string | null,
    theme: string,
    players: Player[],
    timer: Date | null,
    version: number
}