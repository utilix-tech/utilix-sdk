/**
 * Example: Batch processing — run AI agent tools over many items concurrently
 */

import {
  detectPii,
  redactPii,
  detectSecrets,
  estimateTokens,
  extractKeywords,
} from '@utilix-tech/sdk/ai_agent'

// --- Batch PII scan + redact ---
async function batchRedact(documents: Array<{ id: string; text: string }>) {
  return documents.map(doc => {
    const scan = detectPii(doc.text)
    if (scan.findings.length === 0) return { id: doc.id, text: doc.text, redacted: false }

    const clean = redactPii(doc.text, { replacement: '[REDACTED]' })
    return { id: doc.id, text: clean.text, redacted: true, types: scan.findings.map(f => f.type) }
  })
}

// --- Batch token counting (e.g. before sending to an LLM) ---
function batchEstimate(texts: string[], model: 'gpt-4o' | 'claude-3-5' = 'gpt-4o') {
  return texts.map(text => {
    const est = estimateTokens(text, { model })
    return { tokens: est.tokens, cost: est.cost, chars: est.chars }
  })
}

// --- Batch keyword extraction for search indexing ---
function batchIndex(docs: Array<{ id: string; text: string }>, topN = 10) {
  return docs.map(doc => {
    const kw = extractKeywords(doc.text, { topN })
    return { id: doc.id, keywords: kw.keywords.map(k => k.word) }
  })
}

// --- Batch secret scanning (e.g. git commit hook or CI check) ---
function batchScanSecrets(files: Array<{ path: string; content: string }>) {
  const flagged: Array<{ path: string; type: string; value: string }> = []
  for (const file of files) {
    const result = detectSecrets(file.content)
    for (const finding of result.findings) {
      flagged.push({ path: file.path, type: finding.type, value: finding.redacted })
    }
  }
  return flagged
}

// --- Demo ---
const documents = [
  { id: 'doc-1', text: 'Call me at 555-123-4567 or email bob@example.com for details.' },
  { id: 'doc-2', text: 'The deployment succeeded. No sensitive data here.' },
  { id: 'doc-3', text: 'Card: 4111111111111111, SSN: 987-65-4321, account holder Alice.' },
]

console.log('=== PII Batch Redact ===')
const redacted = await batchRedact(documents)
for (const r of redacted) {
  console.log(`[${r.id}] redacted=${r.redacted}${r.redacted ? ` types=${(r as any).types.join(',')}` : ''}`)
}

console.log('\n=== Token Estimates ===')
const estimates = batchEstimate(documents.map(d => d.text))
documents.forEach((d, i) => console.log(`[${d.id}] ${estimates[i].tokens} tokens, $${estimates[i].cost?.toFixed(6) ?? 'n/a'}`))

console.log('\n=== Keyword Index ===')
const indexed = batchIndex(documents, 5)
for (const idx of indexed) {
  console.log(`[${idx.id}] ${idx.keywords.join(', ')}`)
}

const codeFiles = [
  { path: 'config.js', content: 'const OPENAI_KEY = "sk-proj-abc123xyzDEF456"' },
  { path: 'utils.ts', content: 'export function greet(name: string) { return `Hello ${name}` }' },
]

console.log('\n=== Secret Scan ===')
const secrets = batchScanSecrets(codeFiles)
if (secrets.length === 0) {
  console.log('No secrets found.')
} else {
  for (const s of secrets) {
    console.log(`ALERT ${s.path}: ${s.type} → ${s.value}`)
  }
}
