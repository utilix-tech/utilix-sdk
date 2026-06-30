/**
 * Example: JSON utilities for agent workflows
 */

import {
  flattenJson, mergeJson, diffJson,
  extractJson, validateJsonSchema, repairJson,
  compressJson,
} from '@utilix-tech/sdk/ai_agent'

// --- Extract JSON from messy LLM output ---
const llmOutput = `
  Sure! Here's the data you asked for:
  {"name": "Alice", "score": 42, "tags": ["ml", "python"]}
  Let me know if you need anything else.
`
const extracted = extractJson(llmOutput)
console.log(extracted.blocks[0].parsed) // { name: 'Alice', score: 42, tags: [...] }

// --- Flatten nested config ---
const config = { database: { host: 'localhost', port: 5432, ssl: { enabled: true } } }
const flat = flattenJson(config)
console.log(flat)
// { 'database.host': 'localhost', 'database.port': 5432, 'database.ssl.enabled': true }

// --- Deep merge tool outputs ---
const merged = mergeJson(
  { status: 'ok', data: { users: 10 } },
  { data: { revenue: 5000 } },
)
console.log(merged.merged) // { status: 'ok', data: { users: 10, revenue: 5000 } }

// --- Diff before/after states (pass objects, not strings) ---
const before = { plan: 'free', limit: 100, features: ['export'] }
const after  = { plan: 'pro',  limit: 5000, features: ['export', 'api'] }
const diff = diffJson(before, after)
diff.entries.filter(e => e.op !== 'unchanged').forEach(e =>
  console.log(e.op, e.path, e.oldValue, '→', e.newValue)
)
// changed  plan    free → pro
// changed  limit   100  → 5000
// added    features[1]  → api

// --- Validate schema ---
const schema = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'number' } },
  required: ['name'],
}
const result = validateJsonSchema({ name: 'Bob', age: 'thirty' }, schema)
console.log(result.valid)  // false
console.log(result.errors) // [{ path: 'age', message: '...' }]

// --- Repair malformed JSON ---
const broken = "{'key': 'value', 'list': [1, 2, 3,]}"
const repaired = repairJson(broken)
console.log(repaired.repaired) // {"key": "value", "list": [1, 2, 3]}
console.log(repaired.fixes)    // ['Replaced single quotes...', 'Removed trailing commas']

// --- Compress JSON to reduce tokens ---
const bloated = {
  users: [{ id: 1, name: 'Alice', deletedAt: null, metadata: {} }],
}
const compressed = compressJson(bloated, { removeNulls: true, removeEmptyObjects: true })
console.log(compressed.compressed) // {"users":[{"id":1,"name":"Alice"}]}
console.log(`Tokens: ${compressed.originalTokens} → ${compressed.compressedTokens} (${compressed.removedNulls} nulls removed)`)
