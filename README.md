# custom-info-local-mcp

RAGを活用したMCPサーバー。

埋め込みやベクトルデータベースを全てローカルで動作させるため、機密事項をクラウドのLLMプロバイダーに渡さなくて良い。

## 前提条件

- Node.js (>=20.9.0)
- pnpm
- [Ollama](https://ollama.com/) のインストールと起動

### Ollamaのセットアップ

1. [Ollama公式サイト](https://ollama.com/)からOllamaをダウンロード・インストール
2. Ollamaサーバーを起動:
   ```bash
   ollama serve
   ```

## インストール

```bash
pnpm install
```

## 使用方法

### 1. データベースの作成

Markdownファイルからデータベースを作成します:

```bash
pnpm tsx src/entrypoint/cli.ts create "docs/**/*.md"
```

### 2. クエリのテスト

作成したデータベースに対してクエリを実行してテストします:

```bash
pnpm tsx src/entrypoint/cli.ts query "検索したい内容"
```

## Docker

配布可能なDockerイメージとして利用する場合:

```bash
# イメージのビルド
docker build -t custom-info-local-mcp .
```

## MCPクライアントでの使用

`mcp.json`に以下の設定を追加:

```json
{
  "mcpServers": {
    "custom-info": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "custom-info-local-mcp"]
    }
  }
}
```
