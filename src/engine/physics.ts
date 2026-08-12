import type { ControlInput, LanderState } from "./types";
import { FUEL_BURN, GRAVITY, ROTATE_SPEED, THRUST_ACCEL } from "./types";

/** angle を [-180, 180) に正規化する(SPEC §3) */
function normalizeAngle(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/**
 * 半陰的オイラーによる 1 ステップ積分。純関数(引数を破壊しない)。
 * 仕様: SPEC.md §3 / テスト: TEST_SPEC.md T1-1〜T1-7
 */
export function step(
  state: LanderState,
  input: ControlInput,
  dt: number,
): LanderState {
  if (state.status !== "flying") return state;

  const angle = normalizeAngle(state.angle + input.rotate * ROTATE_SPEED * dt);

  const thrusting = input.thrust && state.fuel > 0;
  const rad = (angle * Math.PI) / 180;
  const ax = thrusting ? THRUST_ACCEL * Math.sin(rad) : 0;
  const ay = GRAVITY - (thrusting ? THRUST_ACCEL * Math.cos(rad) : 0);

  const vx = state.vx + ax * dt;
  const vy = state.vy + ay * dt;
  const x = state.x + vx * dt;
  const y = state.y + vy * dt;

  const fuel = thrusting ? Math.max(0, state.fuel - FUEL_BURN * dt) : state.fuel;

  return { ...state, x, y, vx, vy, angle, fuel };
}
