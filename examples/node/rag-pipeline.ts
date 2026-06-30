/**
 * Example: Full RAG pre-processing pipeline
 * Scrape → compress → chunk → embed-ready output
 */

import {
  compressHtml,
  chunkText,
  estimateTokens,
  trimToTokens,
  rerankChunks,
  extractEntities,
  deduplicateLines,
} from '@utilix-tech/sdk/ai_agent'

const CONTEXT_BUDGET = 6000 // tokens reserved for retrieved context

// Step 1: Compress raw HTML from a web scrape
async function preprocessPage(rawHtml: string, url: string) {
  const compressed = compressHtml(rawHtml, {
    removeScripts: true,
    removeStyles: true,
    removeComments: true,
    collapseWhitespace: true,
    removeHiddenElements: true,
  })

  console.log(`[${url}] ${compressed.originalBytes}B → ${compressed.compressedBytes}B (${compressed.savingsPct.toFixed(0)}% saved)`)
  return compressed.html
}

// Step 2: Chunk for embedding
function chunkForEmbedding(text: string) {
  return chunkText(text, {
    maxTokens: 256,
    overlap: 32,
    strategy: 'sentence', // respect sentence boundaries
  })
}

// Step 3: Retrieve and re-rank for a query
function retrieveForQuery(query: string, chunks: string[], topK = 5) {
  const result = rerankChunks(query, chunks)
  return result.ranked.slice(0, topK)
}

// Step 4: Pack top chunks into context window
function packContext(rankedChunks: Array<{ chunk: string; score: number }>, budget: number) {
  const lines = rankedChunks.map(c => c.chunk)
  const joined = lines.join('\n\n---\n\n')
  const est = estimateTokens(joined)

  if (est.tokens <= budget) return joined

  // Trim to fit
  return trimToTokens(joined, { maxTokens: budget, strategy: 'end' }).text
}

// --- Demo ---
const fakeHtml = `
  <html><head><script>tracking()</script><style>body{font:16px}</style></head>
  <body>
    <nav>Home | About | Contact</nav>
    <main>
      <h1>Understanding Vector Databases</h1>
      <p>A vector database stores high-dimensional embeddings and enables similarity search over them.
      Unlike traditional databases that match exact values, vector DBs use approximate nearest-neighbor
      (ANN) algorithms like HNSW or IVF-Flat to find semantically similar content in milliseconds.</p>
      <p>Common use cases include semantic search, recommendation systems, RAG pipelines for LLMs,
      image similarity, and fraud detection.</p>
      <p>Popular options: Pinecone, Weaviate, Qdrant, Chroma, pgvector.</p>
    </main>
    <footer>© 2024 Example Corp</footer>
  </body></html>
`

const clean = await preprocessPage(fakeHtml, 'https://example.com/vector-dbs')
const chunks = chunkForEmbedding(clean)
console.log(`Produced ${chunks.chunks.length} chunks`)

const query = 'what algorithms do vector databases use for search?'
const topChunks = retrieveForQuery(query, chunks.chunks.map(c => c.text))
const context = packContext(topChunks, CONTEXT_BUDGET)

const finalTokens = estimateTokens(context)
console.log(`Context: ${finalTokens.tokens} tokens, ${topChunks.length} chunks`)
console.log('\n--- Context window ---')
console.log(context)

// Also extract any named entities from the page for metadata
const entities = extractEntities(clean)
console.log('\nEntities found:', entities.byType)
