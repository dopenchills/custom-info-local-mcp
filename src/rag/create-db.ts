import { MDocument } from "@mastra/rag"
import * as fs from 'fs'
import { glob } from 'fs/promises'
import * as path from 'path'
import { embedMany } from "ai";
import { INDEX_NAME, VECTOR_CONFIG, EMBEDDING_MODEL, createVectorStore } from './config.js'

export async function createDb(patterns?: string[]) {
  const filePatterns = patterns && patterns.length > 0 ? patterns : []

  if (filePatterns.length === 0) {
    throw new Error('No patterns provided')
  }
  
  console.log('🔍 Finding markdown files...')
  const allFiles: string[] = []
  
  for (const pattern of filePatterns) {
    try {
      const matchedFiles: string[] = []
      for await (const file of glob(pattern, { cwd: process.cwd() })) {
        matchedFiles.push(path.resolve(file))
      }
      allFiles.push(...matchedFiles)
    } catch (error) {
      console.warn(`⚠️ Warning: Could not process pattern "${pattern}":`, error)
    }
  }

  if (allFiles.length === 0) {
    throw new Error('No markdown files found matching the provided patterns')
  }

  console.log(`📖 Reading ${allFiles.length} markdown files...`)
  const allChunks: any[] = []
  
  for (const filePath of allFiles) {
    try {
      const markdownContent = fs.readFileSync(filePath, 'utf-8')
      console.log(`  ✅ Processing: ${path.basename(filePath)}`)
      
      const docFromMarkdown = MDocument.fromMarkdown(markdownContent);
      const chunks = await docFromMarkdown.chunk()
      
      const chunksWithMetadata = chunks.map(chunk => ({
        ...chunk,
        filePath: filePath
      }))
      
      allChunks.push(...chunksWithMetadata)
    } catch (error) {
      console.warn(`⚠️ Warning: Could not process file "${filePath}":`, error)
    }
  }

  console.log(`✂️ Total chunks created: ${allChunks.length}`)

  console.log('🗄️ Creating vector store...')
  const vectorStore = createVectorStore()

  console.log('📊 Creating index...')
  await vectorStore.createIndex({
    indexName: INDEX_NAME,
    dimension: VECTOR_CONFIG.dimension,
    metric: VECTOR_CONFIG.metric,
  })

  console.log(`🔢 Generating embeddings for ${allChunks.length} chunks...`)
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: allChunks.map(chunk => chunk.text),
  })

  console.log('💾 Storing embeddings...')
  await vectorStore.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: allChunks.map(chunk => ({
      text: chunk.text,
      filePath: chunk.filePath,
    })),
  })

  console.log('✅ Database created successfully!')
  return { vectorStore, embeddings, chunks: allChunks }
}
