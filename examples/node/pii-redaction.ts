/**
 * Example: PII detection and redaction pipeline
 * Use before logging LLM inputs/outputs or storing user data.
 */

import { detectPii, redactPii, detectSecrets } from '@utilix-tech/sdk/ai_agent'

const userMessage = `
  Hi, I'm Alice Smith. Reach me at alice@example.com or 555-867-5309.
  My SSN is 123-45-6789 and my card ends in 4242.
`

// Detect what's there
const detected = detectPii(userMessage)
console.log('PII found:', detected.findings.map(f => `${f.type}: ${f.value}`))
// PII found: [ 'email: alice@example.com', 'phone: 555-867-5309', 'ssn: 123-45-6789', 'creditCard: ...4242' ]

// Redact before logging
const clean = redactPii(userMessage, { replacement: '[REDACTED]' })
console.log(clean.text)
// Hi, I'm Alice Smith. Reach me at [REDACTED] or [REDACTED]. My SSN is [REDACTED]...

// Also check for leaked secrets in LLM outputs
const llmOutput = 'Use this key: sk-proj-abc123xyz to authenticate'
const secrets = detectSecrets(llmOutput)
if (secrets.findings.length > 0) {
  console.warn('Secret leaked in LLM output!', secrets.findings.map(f => f.type))
}
