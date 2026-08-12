import type { Difficulty, Pad, Terrain } from "./types";
import { WORLD_H, WORLD_W } from "./types";

const STEP = 8; // 点間隔 (m)
const N_POINTS = WORLD_W / STEP + 1; // 51
const Y_MIN = WORLD_H * 0.55;
const Y_MAX = WORLD_H * 0.95;
const EDGE_MARGIN = 8; // ワールド端からパッドまでの余白 (m)
// レイアウト時の最小ギャップ。グリッドスナップで両端が最大 ±4m 動いても
// SPEC §4 の離隔 24m を割らないよう 32m を確保する
const LAYOUT_GAP = 32;

/** 難易度別パッド構成(SPEC §4): [幅 m, 倍率] */
const PAD_SPECS: Record<Difficulty, [number, number][]> = {
  easy: [
    [40, 1],
    [40, 1],
    [40, 1],
  ],
  normal: [
    [32, 2],
    [32, 2],
    [16, 4],
  ],
  hard: [
    [24, 2],
    [12, 5],
  ],
};

/** mulberry32 — シード付き PRNG。[0, 1) を返す */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampY(y: number): number {
  return Math.min(Y_MAX, Math.max(Y_MIN, y));
}

/** 中点変位法で ys[lo..hi] を再帰的に埋める */
function displace(
  ys: number[],
  lo: number,
  hi: number,
  amplitude: number,
  rng: () => number,
): void {
  if (hi - lo < 2) return;
  const mid = (lo + hi) >> 1;
  ys[mid] = clampY((ys[lo] + ys[hi]) / 2 + (rng() * 2 - 1) * amplitude);
  displace(ys, lo, mid, amplitude / 2, rng);
  displace(ys, mid, hi, amplitude / 2, rng);
}

/** x を 8m グリッドへスナップ */
function snap(x: number): number {
  return Math.round(x / STEP) * STEP;
}

/**
 * パッドの x0 を決める。パッド間 LAYOUT_GAP・両端 EDGE_MARGIN を確保した上で
 * 残り余白を rng で配分し、8m グリッドにスナップする。
 */
function layoutPads(specs: [number, number][], rng: () => number): number[] {
  const totalWidth = specs.reduce((s, [w]) => s + w, 0);
  const required = totalWidth + LAYOUT_GAP * (specs.length - 1);
  const free = WORLD_W - 2 * EDGE_MARGIN - required;
  // free を specs.length + 1 個の区間に配分する重み
  const weights = specs.map(() => rng()).concat(rng());
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const xs: number[] = [];
  let cursor = EDGE_MARGIN;
  specs.forEach(([w], i) => {
    cursor += (free * weights[i]) / weightSum;
    xs.push(snap(cursor));
    cursor += w + LAYOUT_GAP;
  });
  return xs;
}

/**
 * シード付き決定論的地形生成。同一 (seed, difficulty) は完全に同一の出力。
 * 仕様: SPEC.md §4 / テスト: TEST_SPEC.md T2-1〜T2-5
 */
export function generateTerrain(seed: number, difficulty: Difficulty): Terrain {
  const rng = mulberry32(seed);

  const ys = new Array<number>(N_POINTS);
  ys[0] = clampY(Y_MIN + rng() * (Y_MAX - Y_MIN));
  ys[N_POINTS - 1] = clampY(Y_MIN + rng() * (Y_MAX - Y_MIN));
  displace(ys, 0, N_POINTS - 1, (Y_MAX - Y_MIN) * 0.6, rng);

  const specs = PAD_SPECS[difficulty];
  const pads: Pad[] = layoutPads(specs, rng).map((x0, i) => {
    const [width, multiplier] = specs[i];
    return { x0, x1: x0 + width, y: 0, multiplier };
  });

  // パッド区間の点を平坦化(区間内の点の平均高さに揃える)
  for (const pad of pads) {
    const idx: number[] = [];
    for (let i = 0; i < N_POINTS; i++) {
      const x = i * STEP;
      if (x >= pad.x0 && x <= pad.x1) idx.push(i);
    }
    const mean = idx.reduce((s, i) => s + ys[i], 0) / idx.length;
    pad.y = clampY(mean);
    for (const i of idx) ys[i] = pad.y;
  }

  const points = ys.map((y, i) => ({ x: i * STEP, y }));
  return { points, pads };
}
