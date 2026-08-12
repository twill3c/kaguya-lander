import type { Difficulty, Terrain } from "./types";

/**
 * Loop 2 (REQ-002) で実装する。
 * mulberry32 によるシード付き決定論的地形生成。
 * 仕様: SPEC.md §4 / テスト: TEST_SPEC.md T2-1〜T2-5
 */
export function generateTerrain(
  _seed: number,
  _difficulty: Difficulty,
): Terrain {
  throw new Error("NotImplemented: Loop 2 (REQ-002)");
}
