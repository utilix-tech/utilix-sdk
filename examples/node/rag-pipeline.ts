/**
 * Example: Full RAG pre-processing pipeline
 * Scrape → compress → chunk → rerank → pack context window
 */

import {
  compressHtml,
  chunkText,
  estimateTokens,
  trimToTokens,
  rerankChunks,
  expandQuery,
  extractEntities,
  summarizeForLlm,
} from '@utilix-tech/sdk/ai_agent'

const CONTEXT_BUDGET = 6000

function logCompression(label: string, before: number, after: number) {
  console.log(`[${label}] ${before} → ${after} tokens (${((1 - after/before)*100).toFixed(0)}% saved)`)
}

// Step 1: Compress raw HTML
function preprocessPage(rawHtml: string): string {
  const result = compressHtml(rawHtml, { removeScripts: true, removeStyles: true, collapseWhitespace: true })
  logCompression('HTML', result.originalTokens, result.compressedTokens)
  return result.compressed  // key is .compressed, not .html
}

// Step 2: Chunk for embedding — chunkText returns TextChunk[] (an array, not {chunks: []})
function chunkForEmbedding(text: string): string[] {
  const chunks = chunkText(text, 256, 32, 'sentence')
  console.log(`Produced ${chunks.length} chunks`)
  return chunks.map(c => c.text)
}

// Step 3: Expand query + rerank
function retrieveForQuery(query: string, chunks: string[], topK = 5) {
  const expanded = expandQuery(query)
  // .terms includes the original plus synonyms
  console.log(`Query expanded: ${expanded.terms.join(', ')}`)
  const result = rerankChunks(query, chunks, topK)
  return result.ranked  // RankedChunk[] with .text and .score
}

// Step 4: Pack into context budget
function packContext(ranked: Array<{ text: string; score: number }>, budget: number): string {
  const joined = ranked.map(r => r.text).join('\n\n---\n\n')
  const tokens = estimateTokens(joined).tokens
  if (tokens <= budget) return joined
  // positional: trimToTokens(text, maxTokens, strategy)
  return trimToTokens(joined, budget, 'end').trimmed
}

// --- Demo ---
const fakeHtml = `
<html><head><script>tracking()</script><style>body{font:16px}</style></head>
<body>
  <nav>Home | About | Contact</nav>
  <main>
    <h1>Understanding Vector Databases</h1>
    <p>A vector database stores high-dimensional embeddings and enables similarity search.
    Unlike traditional databases that match exact values, vector DBs use approximate
    nearest-neighbor (ANN) algorithms like HNSW or IVF-Flat to find semantically similar
    content in milliseconds.</p>
    <p>Common use cases: semantic search, recommendation systems, RAG pipelines for LLMs,
    image similarity, and fraud detection.</p>
    <p>Popular options: Pinecone, Weaviate, Qdrant, Chroma, pgvector.</p>
  </main>
  <footer>© 2024 Example Corp</footer>
</body></html>
`

const clean = preprocessPage(fakeHtml)
const chunks = chunkForEmbedding(clean)

const query = 'what algorithms do vector databases use for search?'
const topChunks = retrieveForQuery(query, chunks)

const context = packContext(topChunks, CONTEXT_BUDGET)
const finalTokens = estimateTokens(context).tokens
console.log(`\nContext: ${finalTokens} tokens, ${topChunks.length} chunks`)

// Optionally summarize if still long
if (finalTokens > 2000) {
  const summary = summarizeForLlm(context, 500, 'extractive')
  console.log(`Summarized to ${summary.summaryTokens} tokens`)
}

// Extract entities from the page for metadata
const entities = extractEntities(clean)
console.log('Entities found:', Object.keys(entities.byType))

console.log('\n--- Top chunks by relevance ---')
topChunks.forEach(c => console.log(`  score=${c.score.toFixed(3)} | ${c.text.slice(0, 60)}`))
