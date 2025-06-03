#!/usr/bin/env node

import { Command } from 'commander'
import { createDb } from '../rag/create-db'
import { queryDb } from '../rag/query-db'

const program = new Command()

program
  .name('rag-markdown')
  .description('RAG system for markdown documents')
  .version('1.0.0')

program
  .command('create')
  .description('Create the vector database from markdown files')
  .argument('[patterns...]', 'Markdown file paths or glob patterns')
  .action(async (patterns) => {
    try {
      console.log('🚀 Starting database creation...')
      await createDb(patterns)
      console.log('🎉 Database creation completed!')
    } catch (error) {
      console.error('❌ Error creating database:', error)
      process.exit(1)
    }
  })

program
  .command('query')
  .description('Query the vector database')
  .argument('<query>', 'The query string to search for')
  .option('-k, --top-k <number>', 'Number of top results to return', '5')
  .action(async (query, options) => {
    try {
      const topK = parseInt(options.topK, 10)
      if (!Number.isInteger(topK) || topK <= 0) {
        throw new Error('The value for --top-k must be a positive integer')
      }
      console.log('🚀 Starting query...')
      const results = await queryDb(query, topK)
      
      console.log('\n📋 Results:')
      console.log('='.repeat(50))
      
      results.forEach((result, index) => {
        console.log(`\n📄 Result ${index + 1} (Score: ${result.score?.toFixed(4) || 'N/A'})`)
        console.log('-'.repeat(30))
        console.log(result.metadata?.text || 'No text available')
      })
      
      console.log('\n✅ Query completed!')
    } catch (error) {
      console.error('❌ Error querying database:', error)
      process.exit(1)
    }
  })

if (process.argv.length <= 2) {
  program.help()
}

program.parse()
