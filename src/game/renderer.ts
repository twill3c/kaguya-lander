import type { LanderState, Terrain } from "../engine/types";
import { WORLD_H, WORLD_W } from "../engine/types";

/** Canvas 論理解像度(IMPLEMENTATION_GUIDE §2)。CSS で親幅にフィットさせる */
export const VIEW_W = 800;
export const VIEW_H = 600;

const SCALE_X = VIEW_W / WORLD_W;
const SCALE_Y = VIEW_H / WORLD_H;

/** ビジュアルトークン(IMPLEMENTATION_GUIDE §3。globals.css と同値) */
const COLOR_SKY = "#0b0e1a";
const COLOR_LINE = "#e8e6df";
const COLOR_LINE_DIM = "#6b7080";
const COLOR_DANGER = "#c25450";

const LINE_WIDTH = 1.5;
const GLOW = 4;

/** ワールド座標 (m) → スクリーン座標 (px) */
function sx(x: number): number {
  return x * SCALE_X;
}
function sy(y: number): number {
  return y * SCALE_Y;
}

/**
 * 機体の線分ジオメトリ(ローカル座標、m)。原点 = 脚接地レベル(judge と一致)。
 * 三角胴 + 二脚の 7 線分(IMPLEMENTATION_GUIDE §3)。
 */
const SHIP_SEGMENTS: [number, number, number, number][] = [
  // 三角胴
  [0, -4.2, -2.2, -1.0],
  [0, -4.2, 2.2, -1.0],
  [-2.2, -1.0, 2.2, -1.0],
  // 左脚 + 足
  [-1.6, -1.0, -3, 0],
  [-3.6, 0, -2.4, 0],
  // 右脚 + 足
  [1.6, -1.0, 3, 0],
  [2.4, 0, 3.6, 0],
];

function strokeSegments(
  ctx: CanvasRenderingContext2D,
  segments: [number, number, number, number][],
): void {
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of segments) {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  ctx.stroke();
}

function drawTerrain(ctx: CanvasRenderingContext2D, terrain: Terrain): void {
  ctx.strokeStyle = COLOR_LINE;
  ctx.shadowColor = COLOR_LINE;
  ctx.beginPath();
  terrain.points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
    else ctx.lineTo(sx(p.x), sy(p.y));
  });
  ctx.stroke();

  // パッドは同色の二重線でわずかに強調する(塗り・別色は使わない)
  for (const pad of terrain.pads) {
    ctx.beginPath();
    ctx.moveTo(sx(pad.x0), sy(pad.y) + 3);
    ctx.lineTo(sx(pad.x1), sy(pad.y) + 3);
    ctx.stroke();
  }
}

function drawLander(
  ctx: CanvasRenderingContext2D,
  state: LanderState,
  thrusting: boolean,
): void {
  ctx.save();
  ctx.translate(sx(state.x), sy(state.y));
  ctx.rotate((state.angle * Math.PI) / 180);
  ctx.scale(SCALE_X, SCALE_Y);
  ctx.lineWidth = LINE_WIDTH / SCALE_X;

  ctx.strokeStyle = state.status === "crashed" ? COLOR_DANGER : COLOR_LINE;
  ctx.shadowColor = ctx.strokeStyle;
  strokeSegments(ctx, SHIP_SEGMENTS);

  // 噴射炎: 長さを乱雑に揺らす線束(ゲーム層なので Math.random 使用可)
  if (thrusting && state.status === "flying" && state.fuel > 0) {
    ctx.strokeStyle = COLOR_LINE_DIM;
    ctx.shadowColor = COLOR_LINE_DIM;
    const flame: [number, number, number, number][] = [-0.9, 0, 0.9].map(
      (fx) => [fx * 0.8, -0.9, fx, 1.2 + Math.random() * 2.2],
    );
    strokeSegments(ctx, flame);
  }

  ctx.restore();
}

/**
 * 1 フレーム描画。ワールド → スクリーン変換は本モジュールに閉じる。
 * 描画は stroke のみ(塗りは背景以外禁止 — IMPLEMENTATION_GUIDE §3)。
 */
export function render(
  ctx: CanvasRenderingContext2D,
  state: LanderState,
  terrain: Terrain,
  thrusting: boolean,
): void {
  ctx.fillStyle = COLOR_SKY;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = "round";
  ctx.shadowBlur = GLOW;

  drawTerrain(ctx, terrain);
  drawLander(ctx, state, thrusting);
}
