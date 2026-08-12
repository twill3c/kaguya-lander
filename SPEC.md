# SPEC.md — kaguya-lander ゲーム仕様

物理定数・判定閾値はすべて本ファイルが正であり、実装・テストは本ファイルの値を参照する。
値の変更は本ファイルの改訂を先に行う(AGENTS.md §4-3)。

## §1 ワールドとシミュレーション

- 座標系: x 右向き正、y **下向き正**(Canvas に一致)。単位はメートル(m)、角度は度(deg)
- ワールド幅 `WORLD_W = 400` m、高さ `WORLD_H = 300` m。開始位置 x=200, y=30、初速 vx=+8, vy=0
- 初期燃料は難易度依存: beginner = 150、easy/normal/hard = 100(REQ-008)
- 固定タイムステップ `DT = 1/60` 秒。描画側は rAF + アキュムレータで DT を厳守する(可変 dt 積分は禁止)
- 積分は半陰的オイラー(velocity → position の順)

## §2 機体状態(`engine/types.ts` LanderState)

| フィールド | 意味 |
|-----------|------|
| x, y | 位置 (m) |
| vx, vy | 速度 (m/s) |
| angle | 機体角度 (deg)。0 = 直立、正 = 時計回り |
| fuel | 残燃料 (0–初期値。初期値は §1 のとおり難易度依存) |
| status | 'flying' \| 'landed' \| 'crashed' |

入力 `ControlInput`: `thrust: boolean`, `rotate: -1 | 0 | 1`

## §3 物理定数(REQ-001)

| 定数 | 値 | 意味 |
|------|-----|------|
| GRAVITY | 1.62 | 月面重力加速度 (m/s²)、+y 方向 |
| THRUST_ACCEL | 4.5 | 全推力時の加速度 (m/s²)、機体の -y 軸方向(angle に従い分解) |
| ROTATE_SPEED | 90 | 回転速度 (deg/s) |
| FUEL_BURN | 10 | 全推力時の燃料消費 (unit/s) |

- 推力の分解: `ax = THRUST_ACCEL * sin(angle)`, `ay = -THRUST_ACCEL * cos(angle)`
- fuel が 0 のとき推力は発生しない(fuel は 0 未満にならない)
- angle は [-180, 180) に正規化する
- `step(state, input, dt)` は**新しい state を返す純関数**(引数を破壊しない)
- status が 'flying' 以外のとき step は state をそのまま返す

## §4 地形生成(REQ-002)

- `generateTerrain(seed, difficulty)` → `Terrain { points: {x, y}[], pads: Pad[] }`
- シード付き PRNG は mulberry32。**同一 seed・同一 difficulty なら完全に同一の出力**(決定論)
- points は x=0 から x=WORLD_W まで昇順、間隔 8 m(51 点)。y は中点変位法で生成し、
  `WORLD_H*0.55 ≤ y ≤ WORLD_H*0.95` にクランプ
- Pad `{ x0, x1, y, multiplier }`: 区間 [x0, x1] の点の y を同一値に均した平坦部
- 難易度別パッド: beginner(超エントリー) = 幅 56m ×3 (×1)、easy = 幅 40m ×3 (×1)、
  normal = 幅 32m ×2 (×2) + 幅 16m ×1 (×4)、
  hard = 幅 24m ×1 (×2) + 幅 12m ×1 (×5)。パッド同士は 24 m 以上離す

## §5 衝突・着陸判定(REQ-003)

- `judge(state, terrain)` → `{ status, padMultiplier? }`
- 機体は脚幅 6 m の線分として扱い、両脚端点の地形面 y(線形補間)との交差で接地判定
- 接地時、以下**すべて**を満たせば 'landed'、ひとつでも欠ければ 'crashed':

| 条件 | 閾値 |
|------|------|
| 垂直速度 | \|vy\| ≤ 2.0 m/s |
| 水平速度 | \|vx\| ≤ 1.0 m/s |
| 機体角度 | \|angle\| ≤ 8 deg |
| 接地位置 | 両脚がひとつのパッド内 |

- x < 0、x > WORLD_W、y < 0 への逸脱は 'crashed'

## §6 スコア(REQ-003)

```
score = round((50 + fuel * 5 + softBonus) * padMultiplier)
softBonus = max(0, (2.0 - |vy|) * 25)      // 最大 50
```
crashed のとき score = 0。

## §7 画面と入力(REQ-004〜006)

- 画面遷移: タイトル → プレイ → リザルト(成功/失敗) → タイトル。状態機械で管理
- キーボード: ↑ or Space = 推力、←/→ = 回転、Enter = 開始/再開、
  1/2/3/4 = 難易度(1 = 超エントリー、2 = easy、3 = normal、4 = hard)
- タッチ: 画面下部 3 分割(左 = 左回転、中央 = 推力、右 = 右回転)
- タイトル/リザルト画面では Enter に加えタップ/クリックでも開始・再開できる(タッチ端末対応)
- HUD: 高度(地形面までの距離)・vx・vy・fuel・angle をタブラー数字で常時表示
- ビジュアルは IMPLEMENTATION_GUIDE.md §3(ベクタスキャン様式)に従う
