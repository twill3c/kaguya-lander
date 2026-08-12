import type { ControlInput, LanderState } from "./types";

/**
 * Loop 1 (REQ-001) で実装する。
 * 半陰的オイラーによる 1 ステップ積分。純関数(引数を破壊しない)。
 * 仕様: SPEC.md §3 / テスト: TEST_SPEC.md T1-1〜T1-7
 */
export function step(
  _state: LanderState,
  _input: ControlInput,
  _dt: number,
): LanderState {
  throw new Error("NotImplemented: Loop 1 (REQ-001)");
}
