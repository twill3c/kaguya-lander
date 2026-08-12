"use client";

/**
 * Loop 5 (REQ-005): 画面遷移(タイトル → プレイ → リザルト → タイトル)と入力接続。
 * HUD・難易度切替(1/2/3)は Loop 6 で実装する。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { calcScore } from "../engine/judge";
import { generateTerrain } from "../engine/terrain";
import type { ControlInput, LanderStatus } from "../engine/types";
import { createInputSource, type InputSource } from "../game/input";
import { VIEW_H, VIEW_W } from "../game/renderer";
import { useGameLoop } from "../game/useGameLoop";

type Phase = "title" | "playing" | "result";

const IDLE: ControlInput = { thrust: false, rotate: 0 };
/** 接地から結果画面までの間(墜落表示を見せる) */
const RESULT_DELAY_MS = 900;

interface RoundResult {
  status: LanderStatus;
  score: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputSource | null>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<RoundResult | null>(null);

  const terrain = useMemo(() => generateTerrain(seed, "normal"), [seed]);
  const onTitle = phase === "title";

  const start = () => {
    setSeed(Math.floor(Math.random() * 0xffffffff));
    setResult(null);
    setRound((r) => r + 1);
    setPhase("playing");
  };

  // Enter = 開始/再開(SPEC §7)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Enter") return;
      if (phase === "title") start();
      else if (phase === "result") setPhase("title");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // プレイ中のみ入力ソースを接続する
  useEffect(() => {
    const canvas = canvasRef.current;
    if (onTitle || !canvas) return;
    const source = createInputSource(canvas);
    inputRef.current = source;
    return () => {
      source.dispose();
      inputRef.current = null;
    };
  }, [onTitle, round]);

  useGameLoop({
    canvasRef,
    terrain,
    resetKey: `${round}:${onTitle}`,
    getInput: () => inputRef.current?.getInput() ?? IDLE,
    onSettled: (status, state, padMultiplier) => {
      setResult({
        status,
        score:
          status === "landed" ? calcScore(state, padMultiplier ?? 1) : 0,
      });
      setTimeout(() => setPhase("result"), RESULT_DELAY_MS);
    },
  });

  return (
    <main
      style={{
        position: "relative",
        width: "min(100%, 800px)",
        aspectRatio: "4 / 3",
      }}
    >
      {phase !== "title" && (
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            display: "block",
            touchAction: "none",
          }}
        />
      )}

      {phase === "title" && (
        <div className="screen" onClick={start}>
          <svg className="moon" viewBox="0 0 400 400" aria-hidden="true">
            <circle
              cx="200"
              cy="200"
              r="164"
              fill="none"
              stroke="var(--line-dim)"
              strokeWidth="1"
            />
          </svg>
          <h1 className="kaguya">かぐや</h1>
          <p className="screen-sub">KAGUYA LANDER</p>
          <p className="screen-controls">
            ↑ / SPACE — 推力 ← → — 回転
            <br />
            タッチ: 画面下部 左 = 左回転 / 中央 = 推力 / 右 = 右回転
          </p>
          <p className="press">PRESS ENTER / TAP</p>
        </div>
      )}

      {phase === "result" && result && (
        <div className="screen" onClick={() => setPhase("title")}>
          {result.status === "landed" ? (
            <>
              <p className="screen-verdict">着陸成功</p>
              <p className="screen-score">SCORE {result.score}</p>
            </>
          ) : (
            <p className="screen-verdict crashed">墜落</p>
          )}
          <p className="press">PRESS ENTER / TAP</p>
        </div>
      )}
    </main>
  );
}
