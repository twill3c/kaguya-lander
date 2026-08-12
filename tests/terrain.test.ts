/**
 * REQ-002 地形生成(TEST_SPEC.md Loop 2)。
 * Loop 2 開始時に `it.fails` → `it` へ変更して Red を確認すること。
 */
import { describe, expect, it } from "vitest";
import { generateTerrain } from "../src/engine/terrain";
import { WORLD_H, WORLD_W } from "../src/engine/types";

describe("Loop 2: terrain.generateTerrain", () => {
  it.fails("T2-1 決定論: 同一 (seed, difficulty) は deep equal", () => {
    expect(generateTerrain(42, "normal")).toEqual(generateTerrain(42, "normal"));
  });

  it.fails("T2-2 シード感度: 異なる seed は一致しない", () => {
    const a = generateTerrain(1, "normal");
    const b = generateTerrain(2, "normal");
    expect(a.points).not.toEqual(b.points);
  });

  it.fails("T2-3 形状制約: 51 点・昇順・間隔 8m・y クランプ", () => {
    const t = generateTerrain(7, "easy");
    expect(t.points).toHaveLength(51);
    t.points.forEach((p, i) => {
      expect(p.x).toBeCloseTo(i * 8);
      expect(p.y).toBeGreaterThanOrEqual(WORLD_H * 0.55);
      expect(p.y).toBeLessThanOrEqual(WORLD_H * 0.95);
    });
    expect(t.points[50].x).toBeCloseTo(WORLD_W);
  });

  it.fails("T2-4 パッド構成: 難易度ごとの本数・幅・倍率", () => {
    const widths = (d: "easy" | "normal" | "hard") =>
      generateTerrain(3, d).pads
        .map((p) => ({ w: p.x1 - p.x0, m: p.multiplier }))
        .sort((a, b) => b.w - a.w);
    expect(widths("easy")).toEqual([
      { w: 40, m: 1 }, { w: 40, m: 1 }, { w: 40, m: 1 },
    ]);
    expect(widths("normal")).toEqual([
      { w: 32, m: 2 }, { w: 32, m: 2 }, { w: 16, m: 4 },
    ]);
    expect(widths("hard")).toEqual([
      { w: 24, m: 2 }, { w: 12, m: 5 },
    ]);
  });

  it.fails("T2-5 パッド平坦性と離隔 ≥ 24m", () => {
    const t = generateTerrain(11, "normal");
    for (const pad of t.pads) {
      const inside = t.points.filter((p) => p.x >= pad.x0 && p.x <= pad.x1);
      expect(inside.length).toBeGreaterThan(0);
      inside.forEach((p) => expect(p.y).toBeCloseTo(pad.y));
    }
    const sorted = [...t.pads].sort((a, b) => a.x0 - b.x0);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].x0 - sorted[i - 1].x1).toBeGreaterThanOrEqual(24);
    }
  });
});
