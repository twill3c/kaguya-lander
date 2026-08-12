# IMPLEMENTATION_GUIDE.md — kaguya-lander 実装ガイド

## §1 責務分離

```
engine/  純関数層(テスト対象の中核)
  types.ts    型と定数。SPEC.md §2-§3 の写像
  physics.ts  step(state, input, dt): LanderState        — I/O なし
  terrain.ts  generateTerrain(seed, difficulty): Terrain — 乱数は内包 mulberry32 のみ
  judge.ts    judge(state, terrain), calcScore(...)      — I/O なし

game/    副作用層(Loop 4 以降。ユニットテスト対象外、Preview で目視検証)
  useGameLoop.ts  rAF + アキュムレータ。accumulator ≥ DT の間 engine.step を回す
  renderer.ts     Canvas 2D へのベクタ描画(engine の型のみ import)
  input.ts        キーボード/タッチ → ControlInput への変換

app/     Next.js 層
  page.tsx     'use client' のゲーム画面コンポーネントを配置
  layout.tsx   メタデータ・フォント読み込み
```

依存方向は `app → game → engine` の一方向のみ。engine から上位を import しない。

## §2 ゲームループ(Loop 4)

```ts
// 概念コード — 可変 dt で積分しないこと(SPEC §1)
let acc = 0, prev = performance.now();
function frame(now: number) {
  acc += Math.min((now - prev) / 1000, 0.1); // タブ復帰時のスパイラル防止
  prev = now;
  while (acc >= DT) { state = step(state, input, DT); acc -= DT; }
  render(ctx, state, terrain);
  requestAnimationFrame(frame);
}
```

- Canvas は固定論理解像度(800×600)で描画し、CSS で親幅にフィット。DPR 対応で `scale` する
- ワールド → スクリーン変換は renderer.ts に閉じる(engine はワールド座標しか知らない)

## §3 ビジュアル方針 — 竹取物語 × 1979 年ベクタスキャン

Atari 版 Lunar Lander のベクタスキャン(線描のみ・面塗りなし)を基調に、
プロジェクト名の由来である竹取物語の静謐さを重ねる。テンプレ的な
ネオングリーン単色は採らず、月白の線と藍鉄の夜空で構成する。

| トークン | 値 | 用途 |
|----------|-----|------|
| --sky | #0B0E1A | 背景(藍鉄。純黒にしない) |
| --line | #E8E6DF | 機体・地形・HUD の線(月白) |
| --line-dim | #6B7080 | 補助線・非アクティブ HUD |
| --accent | #C9A86A | パッド倍率表示・スコア(金茶。使用は 2 箇所まで) |
| --danger | #C25450 | 燃料警告・墜落表示 |

- 描画は `strokeStyle` のみ。塗りは背景以外禁止。線幅 1.5px、`shadowBlur: 4` で微弱な蛍光
- 機体は 7 本前後の線分で構成する三角胴 + 二脚。噴射炎は長さを乱雑に揺らす線束
- タイトル画面: 「かぐや」を明朝(Shippori Mincho、next/font/google)で大きく置き、
  下に "KAGUYA LANDER" と操作説明をモノスペースで添える。**署名要素**として、
  タイトル背景に満月の円弧を一本の細線で描く
- HUD・数値: IBM Plex Mono、`font-variant-numeric: tabular-nums`
- `prefers-reduced-motion` 時はタイトルのアニメーションを止める(ゲーム本体は対象外)

## §4 テスト方針

- engine 3 モジュールのみをユニットテストする。tests/ からは相対パス import
  (`../src/engine/physics`)とし、vitest 設定に alias を持ち込まない
- 浮動小数は `toBeCloseTo`(既定 2 桁)で比較する
- 決定論の検証(T2-1)は「同一シード 2 回呼び出しの deep equal」で行う
- game/ 層は Vercel Preview での目視確認を DoD とする(AGENTS.md §6)

## §5 デプロイ(Loop 0 と Loop 4 以降)

1. GitHub にリポジトリ作成 → `git remote add origin ... && git push -u origin main`
2. Vercel ダッシュボード → Add New Project → リポジトリを import(設定は既定のまま)
3. 以後、PR ごとに Preview URL、main マージで本番が自動デプロイされる
4. CI(GitHub Actions)は lint / test / build を検証。Vercel 側ビルドと二重化しておく
