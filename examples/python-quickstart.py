"""
Python quickstart — utilix-sdk AI agent tools

pip install utilix-sdk
"""

from utilix.tools.ai_agent import (
    estimate_tokens,
    trim_to_tokens,
    chunk_text,
    compress_html,
    extract_entities,
    detect_pii,
    redact_pii,
    rerank_chunks,
    summarize_for_llm,
    diff_json,
)

# ── Token estimation ─────────────────────────────────────────────────────────
text = "The quick brown fox jumps over the lazy dog. " * 100
est = estimate_tokens(text)
print(f"Tokens: {est['tokens']}, Chars: {est['chars']}")

# ── Trim to budget ───────────────────────────────────────────────────────────
result = trim_to_tokens(text, max_tokens=50, strategy="end")
print(f"Trimmed: {result['trimmedTokens']} tokens, truncated={result['truncated']}")

# ── Chunk with overlap ───────────────────────────────────────────────────────
chunks = chunk_text("Long document content here..." * 50, max_tokens=100, overlap=20)
print(f"Chunks: {len(chunks)}")
for c in chunks[:3]:
    print(f"  [{c['index']}] {c['tokens']} tokens")

# ── Compress HTML ────────────────────────────────────────────────────────────
html = "<html><head><script>alert(1)</script><style>body{color:red}</style></head><body><h1>Hello</h1><p>World</p></body></html>"
compressed = compress_html(html, remove_scripts=True, remove_styles=True, collapse_whitespace=True)
print(f"HTML: {compressed['originalBytes']}B → {compressed['compressedBytes']}B ({compressed['savingsPct']:.0f}% saved)")

# ── Extract entities ─────────────────────────────────────────────────────────
text_with_entities = "Contact alice@example.com or call +1-555-867-5309. Server at 192.168.1.1"
entities = extract_entities(text_with_entities)
print("Entities:", entities["byType"])

# ── PII detection and redaction ──────────────────────────────────────────────
sensitive = "My name is Alice, email alice@corp.com, SSN 123-45-6789"
pii = detect_pii(sensitive)
print("PII found:", [(f["type"], f["value"]) for f in pii["findings"]])

redacted = redact_pii(sensitive, replacement="[REDACTED]")
print("Redacted:", redacted["text"])

# ── Rerank chunks ────────────────────────────────────────────────────────────
query = "machine learning training data"
docs = [
    "Python was released in 1991 by Guido van Rossum.",
    "Supervised learning requires labeled training data for ML models.",
    "The coffee machine needs descaling every 3 months.",
    "Neural networks learn patterns from large datasets.",
]
ranked = rerank_chunks(query, docs)
for r in ranked["ranked"]:
    print(f"  score={r['score']:.3f} | {r['chunk'][:60]}")

# ── Summarize to token budget ────────────────────────────────────────────────
long_text = """
Utilix is a platform providing 130+ developer utility tools available in the browser,
via REST API, Node.js SDK, Python SDK, and MCP server. Tools cover JSON formatting,
encoding, hashing, text processing, color utilities, CSS tools, network utilities,
and a specialized AI agent toolkit for LLM pipelines. All tools are deterministic —
no LLM calls needed for any of the core utilities. The AI agent module includes token
estimation, context compression, PII detection, structured extraction, RAG utilities,
and JSON diffing.
"""
summary = summarize_for_llm(long_text, max_tokens=30, strategy="extractive")
print("Summary:", summary["summary"])

# ── JSON diff ────────────────────────────────────────────────────────────────
before = '{"version": "1.0", "plan": "free", "features": ["export"]}'
after  = '{"version": "2.0", "plan": "pro",  "features": ["export", "api", "webhooks"]}'
diff = diff_json(before, after)
for entry in diff["entries"]:
    if entry["op"] != "unchanged":
        print(f"  {entry['op']:8s} {entry['path']}")
