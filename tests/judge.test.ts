/**
 * REQ-003 判定とスコア(TEST_SPEC.md Loop 3)。
 * Loop 3 開始時に `it.fails` → `it` へ変更して Red を確認すること。
 * 地形はテスト内で手組みし、terrain.ts に依存しない(ループ独立性)。
 */
import { describe, expect, it } from "vitest";
import { calcScore, judge } from "../src/engine/judge";
import {
  WORLD_W,
  type LanderState,
  type Terrain,
} from "../src/engine/types";

/** x=0..400 を y=200 の平坦線とし、[100,140] を ×2 パッドにした手組み地形 */
const flat: Terrain = {
  points: Array.from({ length: 51 }, (_, i) => ({ x: i * 8, y: 200 })),
  pads: [{ x0: 100, x1: 140, y: 200, multiplier: 2 }],
};

function lander(over: Partial<LanderState>): LanderState {
  return {
    x: 120, y: 200, vx: 0.5, vy: 1.5, angle: 5, fuel: 50,
    status: "flying", ...over,
  };
}

describe("Loop 3: judge / calcScore", () => {
  it.fails("T3-1 軟着陸成功: 閾値内接地で landed + multiplier", () => {
    const r = judge(lander({}), flat);
    expect(r.status).toBe("landed");
    expect(r.padMultiplier).toBe(2);
  });

  it.fails("T3-2 速度超過で墜落: vy=2.5 / vx=1.2", () => {
    expect(judge(lander({ vy: 2.5 }), flat).status).toBe("crashed");
    expect(judge(lander({ vx: 1.2, vy: 1.0 }), flat).status).toBe("crashed");
  });

  it.fails("T3-3 姿勢不良で墜落: angle=12", () => {
    expect(judge(lander({ angle: 12 }), flat).status).toBe("crashed");
  });

  it.fails("T3-4 パッド外接地は墜落: 完全に外 / 片脚だけ外", () => {
    expect(judge(lander({ x: 200 }), flat).status).toBe("crashed");
    // 脚幅 6m: x=138 なら右脚 141 がパッド (x1=140) を越える
    expect(judge(lander({ x: 138 }), flat).status).toBe("crashed");
  });

  it.fails("T3-5 場外逸脱は墜落: x<0 / x>WORLD_W / y<0", () => {
    expect(judge(lander({ x: -1, y: 100 }), flat).status).toBe("crashed");
    expect(judge(lander({ x: WORLD_W + 1, y: 100 }), flat).status).toBe("crashed");
    expect(judge(lander({ y: -1 }), flat).status).toBe("crashed");
  });

  it.fails("T3-6 スコア式: (50 + fuel*5 + softBonus) * multiplier", () => {
    // fuel=50, vy=1.0 → softBonus=25 → (50+250+25)*2 = 650
    expect(calcScore(lander({ vy: 1.0 }), 2)).toBe(650);
  });

  it.fails("T3-7 飛行中は判定なし: 上空では flying のまま", () => {
    expect(judge(lander({ y: 100 }), flat).status).toBe("flying");
  });
});
