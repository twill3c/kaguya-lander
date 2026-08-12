# kaguya-lander

月面着陸ゲーム(Lunar Lander)。Next.js 15 / React 19 / TypeScript。
ハーネス駆動・ループネイティブ開発の題材プロジェクト。

## クイックスタート

```bash
npm install
npm test        # loop-00 時点: 全テストが .fails で封入済み(緑)
npm run dev
```

## 開発の始め方

1. `git init && git add -A && git commit -m "loop-00: ハーネス初期化"`
2. GitHub リポジトリを作成して push、Vercel に import(IMPLEMENTATION_GUIDE.md §5)
3. Claude Code に「AGENTS.md に従って Loop 1 を実行」と指示する

ドキュメント: AGENTS.md(単一情報源)/ SPEC.md / IMPLEMENTATION_GUIDE.md / TEST_SPEC.md / LOOP_LEDGER.md

注: 初回 `npm install` で package-lock.json が生成されたら loop-00 コミットに含めること
(CI は lock ファイルがあれば `npm ci` 相当で再現的に動く)。
