/**
 * Example: AI agent pipeline using @utilix-tech/sdk/ai_agent
 *
 * This shows a RAG pipeline that:
 * 1. Compresses scraped HTML to remove noise
 * 2. Checks for PII before sending to LLM
 * 3. Chunks the content to fit token budgets
 * 4. Ranks chunks by relevance to the user query
 * 5. Summarizes the top chunks within a token budget
 */

import {
  compressHtml,
  detectPii,
  chunkText,
  rerankChunks,
  summarizeForLlm,
  estimateTokens,
} from '@utilix-tech/sdk/ai_agent'

const USER_QUERY = 'What are the main pricing tiers?'
const MAX_CONTEXT_TOKENS = 3000

async function buildContext(rawHtml: string): Promise<string> {
  // 1. Compress HTML — strip scripts, styles, comments, collapse whitespace
  const compressed = compressHtml(rawHtml, {
    removeScripts: true,
    removeStyles: true,
    removeComments: true,
    collapseWhitespace: true,
  })
  console.log(`HTML compressed: ${compressed.savingsPct}% smaller`)

  const text = compressed.compressed

  // 2. PII check before sending anywhere
  const pii = detectPii(text)
  if (pii.findings.length > 0) {
    console.warn(`PII detected: ${pii.findings.map(f => f.type).join(', ')}`)
    // redact if needed before proceeding
  }

  // 3. Chunk into 500-token segments with 50-token overlap
  const chunks = chunkText(text, { maxTokens: 500, overlap: 50 })
  console.log(`Split into ${chunks.length} chunks`)

  // 4. Rerank by relevance to the user query
  const ranked = rerankChunks(
    USER_QUERY,
    chunks.map(c => c.text),
  )

  // 5. Greedily pick top chunks until token budget is filled
  const selected: string[] = []
  let tokensSoFar = 0
  for (const chunk of ranked.ranked) {
    const t = estimateTokens(chunk.chunk).tokens
    if (tokensSoFar + t > MAX_CONTEXT_TOKENS) break
    selected.push(chunk.chunk)
    tokensSoFar += t
  }

  // 6. Summarize what's left if still too long
  const context = selected.join('\n\n')
  const finalEst = estimateTokens(context)
  if (finalEst.tokens > MAX_CONTEXT_TOKENS) {
    const summary = summarizeForLlm(context, {
      maxTokens: MAX_CONTEXT_TOKENS,
      strategy: 'extractive',
    })
    return summary.summary
  }

  return context
}

// Usage
const html = '<html><head><style>...</style></head><body><h1>Pricing</h1><p>Free: $0/mo...</p></body></html>'
buildContext(html).then(ctx => {
  console.log('Context ready for LLM:', ctx.slice(0, 200), '...')
})
