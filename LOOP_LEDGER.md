# LOOP_LEDGER.md — 実行台帳

| loop | REQ | 日付 | Red→Green | 所感 |
|------|-----|------|-----------|------|
| loop-00 | — | 2026-08-12 | — | ハーネス初期化。engine スタブ + Red 封入テスト + CI を配置。git init・lint/test/build 疎通・GitHub 連携まで完了 |
| loop-01 | REQ-001 | 2026-08-12 | 1 | 半陰的オイラーで step 実装。回転→推力分解→速度→位置→燃料の順。Red 1 回で緑化 |
| loop-02 | REQ-002 | 2026-08-12 | 1 | mulberry32 + 中点変位法。パッドはレイアウトギャップ 32m→8m スナップで離隔 24m を保証。seed 掃引 1500 ケース仕様準拠 |
| loop-03 | REQ-003 | 2026-08-12 | 1 | 場外→接地(両脚±3m の線形補間)→閾値 4 条件の順で判定。calcScore は SPEC §6 の式そのまま。Red 1 回で緑化 |
| loop-04 | REQ-004 | 2026-08-12 | — | renderer + useGameLoop(rAF + 固定 DT アキュムレータ)。ローカル headless Chromium で描画・動作を目視確認。ユニットテスト対象外 |
| loop-05 | REQ-005 | 2026-08-12 | — | input.ts(キー + 下部 3 分割タッチ)と画面状態機械。SPEC §7 にタップ開始を先行追記。headless で遷移一巡・操作を目視確認 |
| loop-06 | REQ-006 | 2026-08-12 | — | HUD(onFrame + ref 直更新)・難易度 1/2/3・パッド倍率 accent 表示・favicon。headless で難易度別パッド構成と HUD 数値を確認 |
