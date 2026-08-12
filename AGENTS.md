# AGENTS.md — kaguya-lander 単一情報源

月面着陸ゲーム(Lunar Lander)を Next.js 15 / React 19 / TypeScript で実装し、
Git 経由で Vercel にデプロイする。本ファイルがハーネスの単一情報源である。
矛盾がある場合は AGENTS.md → SPEC.md → IMPLEMENTATION_GUIDE.md → TEST_SPEC.md の順で優先する。

## §1 技術スタックと構成

- Next.js 15 (App Router) / React 19 / TypeScript strict
- テスト: Vitest(`tests/` 配下、environment: node)
- デプロイ: GitHub → Vercel(main ブランチ自動デプロイ)
- 状態管理ライブラリは導入しない。ゲーム状態は純関数エンジン + React state で管理する

```
kaguya-lander/
├── AGENTS.md               # 本ファイル(単一情報源)
├── CLAUDE.md               # AGENTS.md への薄いポインタ
├── SPEC.md                 # ゲーム仕様(物理定数・判定基準・画面仕様)
├── IMPLEMENTATION_GUIDE.md # モジュール責務分離・描画設計・ビジュアル方針
├── TEST_SPEC.md            # ループ別テストケース表(T1-1〜T6-2)
├── LOOP_LEDGER.md          # 実行台帳
├── src/
│   ├── app/                # Next.js App Router(Loop 4 以降で本実装)
│   ├── engine/             # 純関数エンジン(DOM/Canvas/React 依存禁止)
│   │   ├── types.ts        # 型定義(完成品。変更時は SPEC.md を先に改訂)
│   │   ├── physics.ts      # Loop 1: 物理積分・推力・燃料
│   │   ├── terrain.ts      # Loop 2: シード付き地形生成
│   │   └── judge.ts        # Loop 3: 衝突・着陸判定・スコア
│   └── game/               # Loop 4〜: Canvas 描画・ゲームループ・入力(React 側)
└── tests/                  # Vitest(engine を相対パスで import。alias 不使用)
```

## §2 ループ計画

1 loop = 1 REQ = 1 PR。各ループの受入条件は SPEC.md、テストケースは TEST_SPEC.md を参照。

| Loop | REQ | 内容 | 主対象 |
|------|-----|------|--------|
| 0 | — | ハーネス初期化(本 zip 展開、git init、CI 疎通、Vercel 連携) | 全体 |
| 1 | REQ-001 | 物理エンジン: 固定タイムステップ積分・重力・推力・回転・燃料消費 | `engine/physics.ts` |
| 2 | REQ-002 | 地形生成: シード付き決定論的地形と着陸パッド配置 | `engine/terrain.ts` |
| 3 | REQ-003 | 判定: 地形衝突・着陸成否・スコア計算 | `engine/judge.ts` |
| 4 | REQ-004 | Canvas ベクタ描画とゲームループ(rAF + 固定 dt アキュムレータ) | `game/`, `app/` |
| 5 | REQ-005 | 入力(キーボード + タッチ)と画面遷移(タイトル/プレイ/リザルト) | `game/`, `app/` |
| 6 | REQ-006 | HUD・難易度 3 段階・仕上げ・本番デプロイ確認 | 全体 |
| 7 | REQ-007 | 超エントリー難易度(beginner)追加 — 4 段階化 | `engine/terrain.ts`, `app/` |
| 9 | REQ-008 | beginner の初期燃料 150(1.5 倍) | `engine/types.ts`, `game/` |

## §3 7 段階ループプロトコル

| 段階 | 名称 | 内容 |
|------|------|------|
| 1 | Read | AGENTS.md・SPEC.md 該当節・TEST_SPEC.md 該当ループのテスト表を読む |
| 2 | Plan | 当該ループの変更ファイルと手順を 5 行以内で宣言する |
| 3 | Red | 該当テストの `.fails` マークを外し、失敗することを確認する |
| 4 | Green | 最小実装でテストを通す。SPEC 外の実装はしない |
| 5 | Refactor | テストを緑に保ったまま整理する。`npm run lint` をクリーンにする |
| 6 | Record | LOOP_LEDGER.md に 1 行追記(loop 番号 / REQ / Red→Green 回数 / 所感) |
| 7 | Ship | コミットして PR(`loop-NN: REQ-XXX 概要`)。CI 緑を確認してマージ |

## §4 ガードレール

1. **engine/ は純関数のみ。** DOM・Canvas・React・`Date.now()`・`Math.random()` を直接使わない。
   乱数はシード付き PRNG(terrain.ts 内 mulberry32)、時間は引数 `dt` で受け取る。
2. **テストからネットワークに出ない。** fetch・外部 API をテストで呼ばない。
3. **SPEC 外の実装をする前に SPEC.md を先に改訂する。** 物理定数・判定閾値の変更も同様。
4. **Red の封入を壊さない。** 未着手ループのテストは `test.fails` のまま残す。
   ループ開始時(段階 3)に外すのは当該ループ分のみ。
5. **1 loop = 1 REQ = 1 PR。** 複数 REQ をまたぐ変更は分割する。
6. **`types.ts` の破壊的変更は SPEC.md §2 の改訂とセットで行う。**

## §5 コマンド

```bash
npm install        # 初回(package-lock.json 生成後は npm ci)
npm run dev        # 開発サーバ
npm test           # Vitest 一括実行
npm run lint       # ESLint
npm run build      # 本番ビルド(Vercel と同一)
```

## §6 Definition of Done(ループ共通)

- 当該ループのテストが全て緑、かつ他ループの `.fails` 封入が維持されている
- `npm run lint` と `npm run build` がクリーン
- LOOP_LEDGER.md に記録済み
- Loop 4 以降は Vercel Preview デプロイで目視確認済み
