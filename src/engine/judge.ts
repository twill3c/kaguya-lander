import type { JudgeResult, LanderState, Pad, Terrain } from "./types";
import { WORLD_W } from "./types";

/** 着陸判定閾値(SPEC §5) */
const MAX_VY = 2.0;
const MAX_VX = 1.0;
const MAX_ANGLE = 8;
const LEG_HALF = 3; // 脚幅 6m の半分

/**
 * x における地形面 y(隣接点の線形補間)。x は [0, WORLD_W] 前提。
 * HUD の高度(地形面までの距離、SPEC §7)計算にも使う。
 */
export function surfaceYAt(terrain: Terrain, x: number): number {
  const pts = terrain.points;
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return pts[pts.length - 1].y;
}

/** 両脚がひとつのパッド内に収まっていればその Pad を返す */
function padUnder(terrain: Terrain, legL: number, legR: number): Pad | undefined {
  return terrain.pads.find((p) => legL >= p.x0 && legR <= p.x1);
}

/**
 * 衝突・着陸判定(SPEC §5)。
 * 機体は脚幅 6m の線分として扱い、両脚端点の地形面との交差で接地を判定する。
 */
export function judge(state: LanderState, terrain: Terrain): JudgeResult {
  if (state.x < 0 || state.x > WORLD_W || state.y < 0) {
    return { status: "crashed" };
  }

  const legL = state.x - LEG_HALF;
  const legR = state.x + LEG_HALF;
  const touching =
    state.y >= surfaceYAt(terrain, Math.max(0, legL)) ||
    state.y >= surfaceYAt(terrain, Math.min(WORLD_W, legR));
  if (!touching) return { status: "flying" };

  const pad = padUnder(terrain, legL, legR);
  const soft =
    Math.abs(state.vy) <= MAX_VY &&
    Math.abs(state.vx) <= MAX_VX &&
    Math.abs(state.angle) <= MAX_ANGLE;

  if (pad && soft) {
    return { status: "landed", padMultiplier: pad.multiplier };
  }
  return { status: "crashed" };
}

/** landed 時のスコア。crashed は 0(SPEC §6) */
export function calcScore(state: LanderState, padMultiplier: number): number {
  const softBonus = Math.max(0, (2.0 - Math.abs(state.vy)) * 25);
  return Math.round((50 + state.fuel * 5 + softBonus) * padMultiplier);
}
