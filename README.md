# @utilix-tech/sdk

> 130+ developer utility tools for Node.js, Python, and AI agents — JSON, encoding, hashing, text, color, CSS, network, and more.

[![npm](https://img.shields.io/npm/v/@utilix-tech/sdk)](https://www.npmjs.com/package/@utilix-tech/sdk)
[![PyPI](https://img.shields.io/pypi/v/utilix-sdk)](https://pypi.org/project/utilix-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[utilix.tech](https://utilix.tech)** · [Docs](https://docs.utilix.tech) · [npm](https://www.npmjs.com/package/@utilix-tech/sdk) · [PyPI](https://pypi.org/project/utilix-sdk/)

---

## Installation

```bash
# Node.js
npm install @utilix-tech/sdk

# Python
pip install utilix-sdk
```

---

## Quick Start — Node.js

```typescript
import { parseJson, minifyJson } from '@utilix-tech/sdk/json'
import { encodeBase64, decodeBase64 } from '@utilix-tech/sdk/encoding'
import { hashOne } from '@utilix-tech/sdk/hashing'

// Parse and format JSON
const result = parseJson('{"name":"Alice","age":30}')
console.log(result.formatted) // pretty-printed JSON

// Base64
const encoded = encodeBase64('Hello, Utilix!')
const decoded = decodeBase64(encoded)

// Hash
const hash = hashOne('password123', 'sha256')
```

## Quick Start — Python

```python
from utilix.tools.json import parse_json, minify_json
from utilix.tools.encoding import encode_base64, decode_base64
from utilix.tools.hashing import hash_one

# Parse and format JSON
result = parse_json('{"name":"Alice","age":30}')
print(result['formatted'])

# Base64
encoded = encode_base64('Hello, Utilix!')
decoded = decode_base64(encoded)

# Hash
h = hash_one('password123', 'sha256')
```

---

## AI Agent Tools (`@utilix-tech/sdk/ai_agent`)

28 deterministic tools purpose-built for LLM pipelines and AI agents. No API key needed — everything runs locally.

```typescript
import {
  estimateTokens, trimToTokens, chunkText,
  extractUrls, extractJson, extractTables, extractEntities,
  sanitizeHtml, flattenJson, mergeJson, deduplicateLines,
  compressHtml, compressMarkdown, compressJson,
  rerankChunks, scoreRelevance, expandQuery, summarizeForLlm,
  detectPii, redactPii, detectSecrets, detectPromptInjection,
  diffJson, validateJsonSchema, repairJson,
} from '@utilix-tech/sdk/ai_agent'
```

### Token Management

```typescript
// Estimate tokens before sending to an LLM
const est = estimateTokens('Your long document here...')
console.log(est.tokens)     // estimated token count
console.log(est.chars)      // character count

// Trim text to fit a token budget
const result = trimToTokens('Very long text...', 2000, 'end')
console.log(result.trimmed)           // trimmed text
console.log(result.truncated)         // true if text was cut
console.log(result.trimmedTokens)     // tokens in output

// Split text into chunks with overlap
const chunks = chunkText('Long document...', { maxTokens: 500, overlap: 50 })
chunks.forEach(c => console.log(`Chunk ${c.index}: ${c.tokens} tokens`))
```

### Context Compression

```typescript
// Strip scripts/styles/comments from HTML before LLM ingestion
const html = compressHtml('<html>...</html>', {
  removeScripts: true,
  removeStyles: true,
  removeComments: true,
  collapseWhitespace: true,
})
console.log(`Saved ${html.savingsPct}%`)

// Compress Markdown (collapse blank lines, strip frontmatter)
const md = compressMarkdown(markdownString, { stripFrontmatter: true })

// Minify JSON (remove nulls, empty arrays/objects)
const json = compressJson(jsonString, { removeNulls: true, sortKeys: true })

// Summarize text to fit a token budget (extractive, no LLM)
const summary = summarizeForLlm(longText, { maxTokens: 500, strategy: 'extractive' })
```

### Structured Extraction

```typescript
// Extract all URLs from text or HTML
const urls = extractUrls('<a href="https://example.com">link</a> and https://other.com')
console.log(urls.urls) // [{ url, type, domain }]

// Extract JSON embedded anywhere in LLM output
const extracted = extractJson('Here is the result: {"key": "value"} done.')
console.log(extracted.found) // [{ value: { key: 'value' }, raw: '{"key":"value"}' }]

// Extract HTML tables into JSON arrays
const tables = extractTables('<table><tr><th>Name</th></tr><tr><td>Alice</td></tr></table>')
tables.tables.forEach(t => console.log(t.headers, t.rows))

// NER-lite: extract emails, phones, IPs, dates, credit cards, IBANs
const entities = extractEntities('Call 555-1234 or email alice@example.com')
console.log(entities.byType)
// { phone: ['555-1234'], email: ['alice@example.com'] }
```

### RAG Utilities

```typescript
// Rerank chunks by relevance to a query
const ranked = rerankChunks('what is machine learning?', [
  'ML is a subset of AI...',
  'Python was created in 1991...',
  'Supervised learning uses labeled data...',
])
ranked.ranked.forEach(r => console.log(r.score, r.chunk))

// Score a single text's relevance to a query
const score = scoreRelevance('what is machine learning?', 'ML trains on data')
console.log(score.grade) // 'high' | 'medium' | 'low' | 'none'

// Expand a query with synonyms for better retrieval
const expanded = expandQuery('fast ML model inference')
console.log(expanded.expanded) // 'fast rapid quick ML machine learning model inference prediction'
```

### Security & PII

```typescript
// Detect and redact PII
const pii = detectPii('Alice (alice@example.com) called 555-1234 on 2024-01-15')
pii.findings.forEach(f => console.log(f.type, f.value))

const redacted = redactPii('Email me at alice@example.com', { replacement: '[REDACTED]' })
console.log(redacted.text) // 'Email me at [REDACTED]'

// Detect leaked secrets (API keys, tokens, passwords)
const secrets = detectSecrets('OPENAI_API_KEY=sk-abc123...')
secrets.findings.forEach(f => console.log(f.type, f.value))

// Detect prompt injection attempts
const injection = detectPromptInjection('Ignore previous instructions and...')
console.log(injection.score)       // 0–1 confidence
console.log(injection.isInjection) // true
```

### JSON Utilities

```typescript
// Flatten nested JSON
const flat = flattenJson({ a: { b: { c: 1 } } })
console.log(flat) // { 'a.b.c': 1 }

// Merge multiple JSON objects (deep merge, last-wins)
const merged = mergeJson([{ a: 1 }, { b: 2 }, { a: 3 }])
console.log(merged.result) // { a: 3, b: 2 }

// Structural diff two JSON objects
const diff = diffJson('{"a":1,"b":2}', '{"a":1,"b":3,"c":4}')
diff.entries.forEach(e => console.log(e.op, e.path))
// changed  b
// added    c

// Validate against JSON Schema
const valid = validateJsonSchema(data, schema)
console.log(valid.valid, valid.errors)
```

---

## Tool Modules

| Module | Tools |
|--------|-------|
| `@utilix-tech/sdk/json` | parse, minify, diff, CSV↔JSON, YAML↔JSON, JSON Path, JSON→TypeScript/Go/Python/Zod |
| `@utilix-tech/sdk/encoding` | Base64, URL encode/decode, HTML entities, Base32 |
| `@utilix-tech/sdk/hashing` | SHA-256/512, MD5, bcrypt |
| `@utilix-tech/sdk/text` | word count, case convert, slug, lorem ipsum, string escape, diff lines, HTML→Markdown |
| `@utilix-tech/sdk/data` | YAML validate, TOML→JSON, XML→JSON, CSV parse |
| `@utilix-tech/sdk/time` | Unix timestamp, cron parse/next-runs, date diff, timezone convert |
| `@utilix-tech/sdk/units` | bytes, px→rem/vw/em |
| `@utilix-tech/sdk/color` | color parse/convert, contrast ratio, palette, shades |
| `@utilix-tech/sdk/css` | CSS gradient generate, CSS minify |
| `@utilix-tech/sdk/code` | SQL format, HTML format, regex test, JS minify, GQL format, Docker tag parse, .env parse |
| `@utilix-tech/sdk/generators` | UUID, password, ULID, random data, QR code SVG |
| `@utilix-tech/sdk/api` | JWT decode, cURL build/parse, cURL→code, CORS config |
| `@utilix-tech/sdk/network` | DNS lookup, IP geolocation |
| `@utilix-tech/sdk/misc` | SVG optimize, char→codepoint, number→words |
| `@utilix-tech/sdk/ai_agent` | 28 AI agent utilities (see above) |

---

## Python Modules

```python
from utilix.tools.json import parse_json, diff_json, json_to_csv
from utilix.tools.encoding import encode_base64, encode_url
from utilix.tools.hashing import hash_one, hash_password
from utilix.tools.text import convert_case, slugify, diff_lines
from utilix.tools.time import from_unix, diff_dates, get_next_runs
from utilix.tools.color import parse_color, check_contrast, generate_palette
from utilix.tools.ai_agent import (
    estimate_tokens, trim_to_tokens, chunk_text,
    extract_urls, extract_json, detect_pii, redact_pii,
    compress_html, rerank_chunks, summarize_for_llm,
)
```

---

## Use with AI Agents

The `ai_agent` module is designed to be called directly from tool-use in Claude, GPT, Gemini, or any agent framework:

```typescript
// Claude tool-use example (Anthropic SDK)
const tools = [
  {
    name: 'trim_text_to_tokens',
    description: 'Trim text to fit within a token budget',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        max_tokens: { type: 'number' },
      },
      required: ['text', 'max_tokens'],
    },
  },
]

// Handle tool call
if (toolName === 'trim_text_to_tokens') {
  const { text, max_tokens } = toolInput
  return trimToTokens(text, max_tokens)
}
```

Or use the **MCP server** to expose all tools to Claude Desktop, Cursor, and VS Code automatically — see [@utilix-tech/mcp](https://www.npmjs.com/package/@utilix-tech/mcp).

---

## Links

- **Web app**: [utilix.tech](https://utilix.tech) — try every tool in the browser
- **REST API**: [api.utilix.tech](https://api.utilix.tech) — same tools over HTTP
- **MCP server**: [@utilix-tech/mcp](https://www.npmjs.com/package/@utilix-tech/mcp) — Claude Desktop / Cursor integration
- **Docs**: [docs.utilix.tech](https://docs.utilix.tech)

## License

MIT
