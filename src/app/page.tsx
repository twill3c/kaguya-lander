"use client";

/**
 * Loop 4 (REQ-004): Canvas ゲーム画面。入力・画面遷移は Loop 5、HUD・難易度は Loop 6。
 * 現段階は無入力の自由落下を描画し、接地 2.5 秒後に自動リセットして動作を見せる
 * (リセットは Loop 5 のリザルト画面遷移で置換する)。
 */
import { useMemo, useRef, useState } from "react";
import { generateTerrain } from "../engine/terrain";
import { useGameLoop } from "../game/useGameLoop";
import { VIEW_H, VIEW_W } from "../game/renderer";

const TERRAIN_SEED = 20260812;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [round, setRound] = useState(0);
  const terrain = useMemo(() => generateTerrain(TERRAIN_SEED, "normal"), []);

  useGameLoop({
    canvasRef,
    terrain,
    resetKey: round,
    onSettled: () => {
      setTimeout(() => setRound((r) => r + 1), 2500);
    },
  });

  return (
    <main style={{ width: "min(100%, 800px)", padding: "16px" }}>
      <canvas
        ref={canvasRef}
        width={VIEW_W}
        height={VIEW_H}
        style={{ width: "100%", aspectRatio: "4 / 3", display: "block" }}
      />
      <p
        style={{
          color: "var(--line-dim)",
          fontSize: "12px",
          textAlign: "center",
          marginTop: "8px",
          letterSpacing: "0.2em",
        }}
      >
        loop-04: ゲームループ疎通 — 操作系は loop-05 で実装
      </p>
    </main>
  );
}
