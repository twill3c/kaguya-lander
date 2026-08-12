"use client";

import type { ControlInput } from "../engine/types";

/** タッチ操作を受け付ける画面下部の割合(上端 = 高さの 55% 位置)— SPEC §7「画面下部 3 分割」 */
const TOUCH_ZONE_TOP = 0.55;

export interface InputSource {
  getInput(): ControlInput;
  dispose(): void;
}

/** 操作バー(REQ-010)のボタン種別。ボタン要素の data-control 属性に対応 */
export type ControlAction = "left" | "thrust" | "right";

/**
 * キーボード(↑/Space = 推力、←/→ = 回転)とタッチ(下部 3 分割:
 * 左 = 左回転、中央 = 推力、右 = 右回転)、および可視操作バー(REQ-010、
 * Pointer Events でマルチタッチ同時押し対応)を ControlInput へ変換する(SPEC §7)。
 * Enter・難易度キーなど画面遷移系はここでは扱わない(page.tsx 側)。
 */
export function createInputSource(
  touchTarget: HTMLElement,
  controlBar?: HTMLElement | null,
): InputSource {
  const keys = new Set<string>();
  let touchThrust = false;
  let touchRotate: -1 | 0 | 1 = 0;
  /** 操作バー: pointerId → 押下中のボタン */
  const held = new Map<number, ControlAction>();

  const onKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "Space", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
      keys.add(e.code);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };
  // タブ切替等でキーが押しっぱなし扱いになるのを防ぐ
  const onBlur = () => {
    keys.clear();
  };

  const readTouches = (e: TouchEvent) => {
    e.preventDefault();
    const rect = touchTarget.getBoundingClientRect();
    touchThrust = false;
    touchRotate = 0;
    for (const t of Array.from(e.touches)) {
      const rx = (t.clientX - rect.left) / rect.width;
      const ry = (t.clientY - rect.top) / rect.height;
      if (ry < TOUCH_ZONE_TOP) continue;
      if (rx < 1 / 3) touchRotate = -1;
      else if (rx > 2 / 3) touchRotate = 1;
      else touchThrust = true;
    }
  };

  const onBarDown = (e: PointerEvent) => {
    const btn = (e.target as HTMLElement).closest?.("[data-control]");
    const action = btn?.getAttribute("data-control") as ControlAction | null;
    if (!action) return;
    e.preventDefault();
    held.set(e.pointerId, action);
  };
  const onBarRelease = (e: PointerEvent) => {
    held.delete(e.pointerId);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  touchTarget.addEventListener("touchstart", readTouches, { passive: false });
  touchTarget.addEventListener("touchmove", readTouches, { passive: false });
  touchTarget.addEventListener("touchend", readTouches, { passive: false });
  touchTarget.addEventListener("touchcancel", readTouches, { passive: false });
  controlBar?.addEventListener("pointerdown", onBarDown);
  // 指がボタン外へ滑ってから離れても取りこぼさないよう window で解放を拾う
  window.addEventListener("pointerup", onBarRelease);
  window.addEventListener("pointercancel", onBarRelease);

  return {
    getInput() {
      const actions = new Set(held.values());
      const keyRotate =
        (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
      const barRotate =
        (actions.has("right") ? 1 : 0) - (actions.has("left") ? 1 : 0);
      const rotate = (keyRotate !== 0
        ? keyRotate
        : touchRotate !== 0
          ? touchRotate
          : barRotate) as -1 | 0 | 1;
      return {
        thrust:
          keys.has("ArrowUp") ||
          keys.has("Space") ||
          touchThrust ||
          actions.has("thrust"),
        rotate,
      };
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      touchTarget.removeEventListener("touchstart", readTouches);
      touchTarget.removeEventListener("touchmove", readTouches);
      touchTarget.removeEventListener("touchend", readTouches);
      touchTarget.removeEventListener("touchcancel", readTouches);
      controlBar?.removeEventListener("pointerdown", onBarDown);
      window.removeEventListener("pointerup", onBarRelease);
      window.removeEventListener("pointercancel", onBarRelease);
    },
  };
}
