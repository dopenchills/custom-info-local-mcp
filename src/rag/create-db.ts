import { MDocument } from "@mastra/rag"
import * as fs from 'fs'
import { glob } from 'fs/promises'
import * as path from 'path'
import { embedMany } from "ai";
import { INDEX_NAME, VECTOR_CONFIG, EMBEDDING_MODEL, createVectorStore } from './config'

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

  console.log('🗄️ Creating vector store...')
  const vectorStore = createVectorStore()

  console.log('📊 Creating index...')
  await vectorStore.createIndex({
    indexName: INDEX_NAME,
    dimension: VECTOR_CONFIG.dimension,
    metric: VECTOR_CONFIG.metric,
  })

  console.log(`📖 Processing ${allFiles.length} markdown files one by one...`)
  let totalChunks = 0
  let successCount = 0
  let errorCount = 0
  
  for (const filePath of allFiles) {
    try {
      console.log(`  🔄 Processing: ${path.basename(filePath)}`)
      
      const markdownContent = fs.readFileSync(filePath, 'utf-8')
      const docFromMarkdown = MDocument.fromMarkdown(markdownContent);
      const chunks = await docFromMarkdown.chunk()
      
      const chunksWithMetadata = chunks.map(chunk => ({
        ...chunk,
        filePath: filePath
      }))
      
      if (chunksWithMetadata.length === 0) {
        console.log(`    ⚠️ No chunks created for: ${path.basename(filePath)}`)
        continue
      }
      
      console.log(`    ✂️ Created ${chunksWithMetadata.length} chunks`)
      
      console.log(`    🔢 Generating embeddings for ${chunksWithMetadata.length} chunks...`)
      const { embeddings } = await embedMany({
        model: EMBEDDING_MODEL,
        values: chunksWithMetadata.map(chunk => chunk.text),
      })
      
      console.log(`    💾 Storing embeddings...`)
      await vectorStore.upsert({
        indexName: INDEX_NAME,
        vectors: embeddings,
        metadata: chunksWithMetadata.map(chunk => ({
          text: chunk.text,
          filePath: chunk.filePath,
        })),  
      })
      
      totalChunks += chunksWithMetadata.length
      successCount++
      console.log(`    ✅ Completed: ${path.basename(filePath)}`)
      
    } catch (error) {
      errorCount++
      console.warn(`⚠️ Warning: Could not process file "${filePath}":`, error)
    }
  }

  if (successCount === 0) {
    throw new Error(`❌ Failed to process any files. ${errorCount} files failed.`)
  } else if (errorCount > 0) {
    console.log(`⚠️ Database created with warnings! Successfully processed: ${successCount}/${allFiles.length} files. Total chunks: ${totalChunks}. Errors: ${errorCount}`)
  } else {
    console.log(`✅ Database created successfully! All ${successCount} files processed. Total chunks: ${totalChunks}`)
  }
  
  return { vectorStore, totalChunks, successCount, errorCount }
}
