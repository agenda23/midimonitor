# MIDI Monitor

MIDIコントローラ入力モニターアプリ - WebMIDI APIを使用したリアルタイムMIDIメッセージ表示ツール

## 概要

PCでMIDIコントローラの入力をリアルタイムでモニターし、各インターフェイスの出力確認や他アプリ開発の助けにするWebアプリケーションです。

## 主な機能

### 🎹 MIDI入力監視
- すべてのMIDIメッセージ（Note On/Off、CC、Program Changeなど）をリアルタイム表示
- ポート名、チャンネル、値などの詳細情報も表示
- 複数MIDIポート接続時は、1台選択してモニター可能

### 📊 表示形式
- **テキストログ**: 上から流れる形式で全メッセージを表示（スクロール可能）
- **グラフィカルUI**: 
  - Control Change → 円形ゲージ（ノブ）
  - Note On/Off → 光る四角ボタン
  - 実際に使用されるCCやチャンネルのみ動的に表示

### 🔍 フィルタリング機能
- チャンネル別フィルタリング（1-16チャンネル）
- メッセージタイプ別フィルタリング

### 💾 ログ機能
- JSON形式でのログ保存・エクスポート
- ログクリア機能
- 古い情報も消さずにスクロール可能（最大1000件）

## 技術仕様

- **フレームワーク**: Remix (TypeScript)
- **API**: WebMIDI API
- **スタイリング**: Tailwind CSS
- **対応ブラウザ**: WebMIDI API対応ブラウザ（Chrome推奨）
- **対応OS**: Mac/Windows

## セットアップ・実行方法

### 前提条件
- Node.js (18以上推奨)
- WebMIDI API対応ブラウザ（Chrome、Edge等）
- MIDIコントローラまたはMIDI対応デバイス

### インストール・実行

```bash
# リポジトリをクローン
git clone https://github.com/agenda23/midimonitor.git
cd midimonitor

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173/` にアクセスしてください。

### 本番ビルド

```bash
# 本番用ビルド
npm run build

# 本番サーバー起動
npm start
```

## 使用方法

1. WebMIDI API対応ブラウザでアプリにアクセス
2. MIDIコントローラをPCに接続
3. 「MIDIポート選択」でデバイスを選択
4. MIDIコントローラを操作すると、リアルタイムでメッセージが表示されます

### フィルタリング
- **チャンネルフィルター**: 特定のチャンネルのメッセージのみ表示
- **メッセージタイプフィルター**: 特定のメッセージタイプのみ表示

### ログ機能
- **ログクリア**: 現在のログをすべてクリア
- **JSONエクスポート**: 現在のログをJSON形式でダウンロード

## ライセンス

MIT License

## 開発者

🤖 Generated with [Claude Code](https://claude.ai/code)
