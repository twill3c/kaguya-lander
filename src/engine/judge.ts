import type { JudgeResult, LanderState, Terrain } from "./types";

/**
 * Loop 3 (REQ-003) で実装する。
 * 仕様: SPEC.md §5-§6 / テスト: TEST_SPEC.md T3-1〜T3-7
 */
export function judge(_state: LanderState, _terrain: Terrain): JudgeResult {
  throw new Error("NotImplemented: Loop 3 (REQ-003)");
}

/** landed 時のスコア。crashed は 0(SPEC §6) */
export function calcScore(
  _state: LanderState,
  _padMultiplier: number,
): number {
  throw new Error("NotImplemented: Loop 3 (REQ-003)");
}
