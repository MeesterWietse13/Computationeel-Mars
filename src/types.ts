export type Difficulty = 'makkelijk' | 'gemiddeld' | 'moeilijk';
export type ScreenState = 'start' | 'settings' | 'builder' | 'game';
export type GameMode = 'mars' | 'auto';
export type Direction = 0 | 1 | 2 | 3; // 0=N, 1=E, 2=S, 3=W
export type GameStatus = 'idle' | 'running' | 'won' | 'lost_crash' | 'lost_bounds' | 'lost_incomplete' | 'lost_alien';
export type Command = 'LEFT' | 'RIGHT' | 'FORWARD' | 'WAIT';

export interface Point {
  x: number;
  y: number;
}
export interface RobotState extends Point {
  dir: Direction;
}
export interface AlienState extends Point {
  axis: 'x' | 'y';
  min: number;
  max: number;
  dir: number; // 1 or -1
  prevX?: number;
  prevY?: number;
}
export interface LetterState extends Point {
  char: string;
  collected: boolean;
}
export interface MapData {
  size: number;
  start: RobotState;
  target?: Point;
  obstacles: Point[];
  aliens: AlienState[];
  letters?: LetterState[];
}
