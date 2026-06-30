"""
Example: Using Utilix as LLM tool implementations
Define tool schemas for your agent, call Utilix for the logic.
"""

import json
from utilix.tools.ai_agent import (
    extract_json,
    repair_json,
    validate_json_schema,
    flatten_json,
    merge_json,
    diff_json,
    extract_entities,
    extract_urls,
    sanitize_html,
    deduplicate_lines,
)

# These functions map 1:1 to tools you'd expose to an LLM agent.
# The agent calls them; Utilix handles the implementation.

def tool_extract_json(raw_text: str) -> dict:
    """Pull JSON out of noisy LLM output."""
    result = extract_json(raw_text)
    return {
        "found": len(result["found"]),
        "objects": [item["value"] for item in result["found"]],
    }

def tool_fix_json(broken_json: str) -> dict:
    """Repair malformed JSON."""
    result = repair_json(broken_json)
    return {"fixed": result["json"], "changes": result["fixes"]}

def tool_validate(data: dict, schema: dict) -> dict:
    """Validate data against a JSON Schema."""
    result = validate_json_schema(data, schema)
    return {"valid": result["valid"], "errors": result["errors"]}

def tool_diff(before: str, after: str) -> dict:
    """Show what changed between two JSON configs."""
    result = diff_json(before, after)
    changes = [e for e in result["entries"] if e["op"] != "unchanged"]
    return {"changes": changes, "total": len(changes)}

def tool_extract_entities(text: str) -> dict:
    """Extract emails, phones, IPs, dates etc. from text."""
    return extract_entities(text)["byType"]

def tool_extract_urls(text: str) -> list[str]:
    """Pull all URLs from text."""
    return extract_urls(text)["urls"]

def tool_sanitize_html(html: str) -> str:
    """Remove dangerous tags before rendering HTML."""
    return sanitize_html(html)["html"]

def tool_dedup_lines(text: str, case_sensitive: bool = False) -> str:
    """Remove duplicate lines."""
    result = deduplicate_lines(text, case_sensitive=case_sensitive)
    return result["text"]


# --- Demo: simulate an agent processing LLM output ---

llm_output = """
Sure! I found the following information. Here's the structured data:

{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}], "total": 2}

Also worth noting: contact support at help@utilix.tech or visit https://utilix.tech/docs.
The admin is at admin@corp.com. IP of the server: 10.0.0.45.
"""

print("=== Extract JSON from LLM output ===")
extracted = tool_extract_json(llm_output)
print(f"Found {extracted['found']} JSON objects:")
for obj in extracted["objects"]:
    print(f"  {json.dumps(obj)}")

print("\n=== Extract entities ===")
entities = tool_extract_entities(llm_output)
for entity_type, values in entities.items():
    if values:
        print(f"  {entity_type}: {values}")

print("\n=== Extract URLs ===")
urls = tool_extract_urls(llm_output)
print("  URLs:", urls)

print("\n=== Fix broken JSON ===")
broken = "{'key': 'value', 'list': [1, 2, 3,], 'nested': {'a': 1}}"
fixed = tool_fix_json(broken)
print(f"  Fixed: {fixed['fixed']}")
print(f"  Changes: {fixed['changes']}")

print("\n=== Validate JSON schema ===")
user_schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer", "minimum": 0},
        "email": {"type": "string", "format": "email"},
    },
    "required": ["name", "email"],
}
valid_result = tool_validate({"name": "Alice", "age": 30, "email": "alice@example.com"}, user_schema)
invalid_result = tool_validate({"name": "Bob", "age": "thirty"}, user_schema)
print(f"  Valid user: {valid_result['valid']}")
print(f"  Invalid user: {invalid_result['valid']}, errors: {invalid_result['errors']}")

print("\n=== Diff two configs ===")
v1 = json.dumps({"version": "1.0", "plan": "free", "rateLimit": 100})
v2 = json.dumps({"version": "2.0", "plan": "pro", "rateLimit": 5000, "webhooks": True})
diff = tool_diff(v1, v2)
print(f"  {diff['total']} changes:")
for c in diff["changes"]:
    print(f"    {c['op']:8s} {c['path']}: {c.get('oldValue')} → {c.get('newValue')}")
