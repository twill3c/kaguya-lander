"use client";

import { useEffect, useRef } from "react";
import { judge } from "../engine/judge";
import { step } from "../engine/physics";
import type {
  ControlInput,
  LanderState,
  LanderStatus,
  Terrain,
} from "../engine/types";
import { DT, initialState } from "../engine/types";
import { render, VIEW_H, VIEW_W } from "./renderer";

const IDLE: ControlInput = { thrust: false, rotate: 0 };

interface GameLoopOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  terrain: Terrain;
  /** 毎ステップ呼ばれる入力取得。省略時は無入力(Loop 5 で接続) */
  getInput?: () => ControlInput;
  /** status が flying 以外へ遷移した瞬間に一度だけ呼ばれる */
  onSettled?: (
    status: LanderStatus,
    state: LanderState,
    padMultiplier?: number,
  ) => void;
  /** 変更するとループとゲーム状態がリセットされる */
  resetKey?: unknown;
}

/**
 * rAF + 固定 DT アキュムレータのゲームループ(IMPLEMENTATION_GUIDE §2)。
 * 可変 dt では積分しない(SPEC §1)。accumulator ≥ DT の間 engine.step を回す。
 */
export function useGameLoop({
  canvasRef,
  terrain,
  getInput,
  onSettled,
  resetKey,
}: GameLoopOptions): void {
  const getInputRef = useRef(getInput);
  getInputRef.current = getInput;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPR 対応: 物理解像度を上げ、描画は論理解像度 800×600 のまま行う
    const dpr = window.devicePixelRatio || 1;
    canvas.width = VIEW_W * dpr;
    canvas.height = VIEW_H * dpr;

    let state = initialState();
    let acc = 0;
    let prev = performance.now();
    let rafId = 0;

    const frame = (now: number) => {
      // タブ復帰時のスパイラル防止(最大 0.1 秒まで)
      acc += Math.min((now - prev) / 1000, 0.1);
      prev = now;

      const input = getInputRef.current?.() ?? IDLE;
      while (acc >= DT) {
        state = step(state, input, DT);
        if (state.status === "flying") {
          const result = judge(state, terrain);
          if (result.status !== "flying") {
            state = { ...state, status: result.status };
            onSettledRef.current?.(result.status, state, result.padMultiplier);
          }
        }
        acc -= DT;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(ctx, state, terrain, input.thrust);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [canvasRef, terrain, resetKey]);
}
