/**
 * kaguya-lander engine 型定義と定数。
 * 値の正は SPEC.md §1-§4。破壊的変更は SPEC.md 改訂とセットで行う(AGENTS.md §4-6)。
 */

export const WORLD_W = 400;
export const WORLD_H = 300;
export const DT = 1 / 60;

export const GRAVITY = 1.62;
export const THRUST_ACCEL = 4.5;
export const ROTATE_SPEED = 90;
export const FUEL_BURN = 10;

export type Difficulty = "beginner" | "easy" | "normal" | "hard";
export type LanderStatus = "flying" | "landed" | "crashed";

export interface LanderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 機体角度 (deg)。0 = 直立、正 = 時計回り。[-180, 180) に正規化 */
  angle: number;
  /** 残燃料 0–100 */
  fuel: number;
  status: LanderStatus;
}

export interface ControlInput {
  thrust: boolean;
  rotate: -1 | 0 | 1;
}

export interface Pad {
  x0: number;
  x1: number;
  y: number;
  multiplier: number;
}

export interface Terrain {
  /** x=0..WORLD_W、昇順・間隔 8m の 51 点 */
  points: { x: number; y: number }[];
  pads: Pad[];
}

export interface JudgeResult {
  status: LanderStatus;
  padMultiplier?: number;
}

/** SPEC §1 の初期状態を返す */
export function initialState(): LanderState {
  return { x: 200, y: 30, vx: 8, vy: 0, angle: 0, fuel: 100, status: "flying" };
}
