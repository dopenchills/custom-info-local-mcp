import * as path from 'path'
import { fileURLToPath } from 'url'
import { LibSQLVector } from '@mastra/libsql'
// import { openai } from '@ai-sdk/openai'
import { ollama } from 'ollama-ai-provider';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const INDEX_NAME = 'markdown'
export const DB_PATH = `file:${path.join(__dirname, '..', '..', 'db', 'index.db')}`

// const OPENAI_DIMENSION = 1536
const LLAMA_DIMENSION = 2048

export const VECTOR_CONFIG = {
  dimension: LLAMA_DIMENSION,
  metric: 'cosine' as const,
  defaultTopK: 5,
}

export const EMBEDDING_MODEL = ollama.embedding('llama3.2:1b')

export function createVectorStore() {
  return new LibSQLVector({
    connectionUrl: DB_PATH,
  })
}
