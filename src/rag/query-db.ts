import { embed } from "ai";
import { INDEX_NAME, VECTOR_CONFIG, EMBEDDING_MODEL, createVectorStore } from './config'

export async function queryDb(query: string, topK: number = VECTOR_CONFIG.defaultTopK) {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: query,
  })

  const vectorStore = createVectorStore()

  const results = await vectorStore.query({
    indexName: INDEX_NAME,
    queryVector: embedding,
    topK,
  })

  return results
}
