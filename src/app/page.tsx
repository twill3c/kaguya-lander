"use client";

/**
 * Loop 5 (REQ-005): 画面遷移(タイトル → プレイ → リザルト → タイトル)と入力接続。
 * Loop 6 (REQ-006): HUD(高度・vx・vy・fuel・angle)・難易度 1/2/3・パッド倍率表示。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { calcScore, surfaceYAt } from "../engine/judge";
import { generateTerrain } from "../engine/terrain";
import type {
  ControlInput,
  Difficulty,
  LanderState,
  LanderStatus,
} from "../engine/types";
import { WORLD_H, WORLD_W } from "../engine/types";
import { createInputSource, type InputSource } from "../game/input";
import { VIEW_H, VIEW_W } from "../game/renderer";
import { useGameLoop } from "../game/useGameLoop";

type Phase = "title" | "playing" | "result";

const IDLE: ControlInput = { thrust: false, rotate: 0 };
/** 接地から結果画面までの間(墜落表示を見せる) */
const RESULT_DELAY_MS = 900;
/** HUD の燃料警告閾値(表示のみ。判定には関与しない) */
const FUEL_WARN = 20;

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "beginner", label: "BEGINNER" },
  { key: "easy", label: "EASY" },
  { key: "normal", label: "NORMAL" },
  { key: "hard", label: "HARD" },
];

interface RoundResult {
  status: LanderStatus;
  score: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputSource | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<RoundResult | null>(null);

  const terrain = useMemo(
    () => generateTerrain(seed, difficulty),
    [seed, difficulty],
  );
  const onTitle = phase === "title";

  const start = () => {
    setSeed(Math.floor(Math.random() * 0xffffffff));
    setResult(null);
    setRound((r) => r + 1);
    setPhase("playing");
  };

  // Enter = 開始/再開、1/2/3 = 難易度(SPEC §7)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter") {
        if (phase === "title") start();
        else if (phase === "result") setPhase("title");
        return;
      }
      if (phase === "title") {
        const idx = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
        if (idx >= 0) setDifficulty(DIFFICULTIES[idx].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // プレイ中のみ入力ソースを接続する
  useEffect(() => {
    const canvas = canvasRef.current;
    if (onTitle || !canvas) return;
    const source = createInputSource(canvas, barRef.current);
    inputRef.current = source;
    return () => {
      source.dispose();
      inputRef.current = null;
    };
  }, [onTitle, round]);

  useGameLoop({
    canvasRef,
    terrain,
    difficulty,
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
    // HUD は毎フレーム ref 直更新(React 再レンダなし)— SPEC §7「常時表示」
    onFrame: (state: LanderState) => {
      const hud = hudRef.current;
      if (!hud) return;
      const alt = Math.max(0, surfaceYAt(terrain, state.x) - state.y);
      const set = (name: string, value: string) => {
        const el = hud.querySelector<HTMLElement>(`[data-hud="${name}"]`);
        if (el) el.textContent = value;
      };
      set("alt", alt.toFixed(0));
      set("vx", state.vx.toFixed(1));
      set("vy", state.vy.toFixed(1));
      set("fuel", state.fuel.toFixed(0));
      set("ang", state.angle.toFixed(0));
      hud
        .querySelector(`[data-hud-row="fuel"]`)
        ?.classList.toggle("danger", state.fuel <= FUEL_WARN);
    },
  });

  return (
    <main className="game-shell">
      <div className="stage">
      {phase !== "title" && (
        <>
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
          <div className="hud" ref={hudRef} aria-hidden="true">
            <div>
              ALT <span data-hud="alt">—</span> m
            </div>
            <div>
              VX <span data-hud="vx">—</span> m/s
            </div>
            <div>
              VY <span data-hud="vy">—</span> m/s
            </div>
            <div data-hud-row="fuel">
              FUEL <span data-hud="fuel">—</span>
            </div>
            <div>
              ANG <span data-hud="ang">—</span> °
            </div>
          </div>
          {/* パッド倍率表示(accent 使用箇所その 1 — もう 1 箇所はスコア) */}
          {terrain.pads.map((pad) => (
            <span
              key={pad.x0}
              className="pad-label"
              style={{
                left: `${(((pad.x0 + pad.x1) / 2) * 100) / WORLD_W}%`,
                top: `${(pad.y * 100) / WORLD_H}%`,
              }}
            >
              ×{pad.multiplier}
            </span>
          ))}
        </>
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
            タッチ: 画面下のボタン ◀ 左回転 / ▲ 推力 / ▶ 右回転
          </p>
          <p className="screen-controls difficulty">
            {DIFFICULTIES.map((d, i) => (
              <span
                key={d.key}
                className={d.key === difficulty ? "sel" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  setDifficulty(d.key);
                }}
              >
                {i + 1} {d.label}
              </span>
            ))}
          </p>
          <p className="press">PRESS ENTER / TAP</p>
          <p className="license">
            <a
              href="https://github.com/twill3c/kaguya-lander/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              MIT License
            </a>{" "}
            © 2026 坂田哲朗 ・{" "}
            <a
              href="https://github.com/twill3c/kaguya-lander"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              GitHub
            </a>
          </p>
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
      </div>

      {/* 可視タッチ操作バー(REQ-010)。pointer: coarse の端末でのみ表示 */}
      {phase !== "title" && (
        <div className="controls-bar" ref={barRef} aria-hidden="true">
          <button type="button" tabIndex={-1} data-control="left">
            ◀
          </button>
          <button type="button" tabIndex={-1} data-control="thrust">
            ▲ 推力
          </button>
          <button type="button" tabIndex={-1} data-control="right">
            ▶
          </button>
        </div>
      )}
    </main>
  );
}
