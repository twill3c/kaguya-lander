/**
 * REQ-001 物理エンジン(TEST_SPEC.md Loop 1)。
 * Loop 1 開始時(段階 3)に `it.fails` → `it` へ変更して Red を確認すること。
 */
import { describe, expect, it } from "vitest";
import { step } from "../src/engine/physics";
import {
  DT,
  GRAVITY,
  THRUST_ACCEL,
  initialState,
  type ControlInput,
  type LanderState,
} from "../src/engine/types";

const idle: ControlInput = { thrust: false, rotate: 0 };
const burn: ControlInput = { thrust: true, rotate: 0 };

function run(state: LanderState, input: ControlInput, seconds: number) {
  let s = state;
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) s = step(s, input, DT);
  return s;
}

describe("Loop 1: physics.step", () => {
  it("T1-1 自由落下: 1 秒後 vy ≈ GRAVITY、姿勢は直立のまま", () => {
    const s = run(initialState(), idle, 1);
    expect(s.vy).toBeCloseTo(GRAVITY, 1);
    expect(s.angle).toBeCloseTo(0);
    expect(s.fuel).toBeCloseTo(100);
  });

  it("T1-2 直立全推力: 1 秒後 vy ≈ GRAVITY - THRUST_ACCEL", () => {
    const s = run(initialState(), burn, 1);
    expect(s.vy).toBeCloseTo(GRAVITY - THRUST_ACCEL, 1);
  });

  it("T1-3 燃料消費: 全推力 1 秒で -10、0 未満にならない", () => {
    const s = run(initialState(), burn, 1);
    expect(s.fuel).toBeCloseTo(90, 1);
    const low = run({ ...initialState(), fuel: 0.05 }, burn, 1);
    expect(low.fuel).toBe(0);
  });

  it("T1-4 燃料切れで推力無効: 自由落下と同一軌道", () => {
    const empty = { ...initialState(), fuel: 0 };
    const a = run(empty, burn, 1);
    const b = run(empty, idle, 1);
    expect(a.vy).toBeCloseTo(b.vy);
    expect(a.y).toBeCloseTo(b.y);
  });

  it("T1-5 回転: rotate=1 を 0.5 秒で angle ≈ +45", () => {
    const s = run(initialState(), { thrust: false, rotate: 1 }, 0.5);
    expect(s.angle).toBeCloseTo(45, 0);
    const wrapped = run({ ...initialState(), angle: 170 }, { thrust: false, rotate: 1 }, 0.5);
    expect(wrapped.angle).toBeCloseTo(-145, 0); // [-180, 180) 正規化
  });

  it("T1-6 純関数性: 引数 state を破壊しない", () => {
    const before = initialState();
    const snapshot = structuredClone(before);
    step(before, burn, DT);
    expect(before).toEqual(snapshot);
  });

  it("T1-7 傾斜推力の分解: angle=90 で水平方向に加速", () => {
    const tilted = { ...initialState(), angle: 90, vx: 0 };
    const s = run(tilted, burn, 1);
    expect(s.vx).toBeCloseTo(THRUST_ACCEL, 1);
    expect(s.vy).toBeCloseTo(GRAVITY, 1);
  });
});

describe("Loop 9: initialState 難易度別初期燃料", () => {
  it("T9-1 beginner は fuel=150、省略/他難易度は fuel=100", () => {
    expect(initialState("beginner").fuel).toBe(150);
    expect(initialState().fuel).toBe(100);
    expect(initialState("easy").fuel).toBe(100);
    expect(initialState("normal").fuel).toBe(100);
    expect(initialState("hard").fuel).toBe(100);
  });
});
