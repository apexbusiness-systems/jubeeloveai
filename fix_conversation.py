with open('supabase/functions/jubee-conversation/index.ts', 'r') as f:
    content = f.read()

retention_comment = """    // Async log (non-blocking)
    // PRIVACY POLICY & CHILD SAFETY ENFORCEMENT:
    // Only a preview of the message is logged (first 50 chars). Numbers are masked.
    // Full conversation text and audio are NEVER stored permanently.
    // Retention for conversation analytics is limited to aggregate sentiment/mood.
"""

content = content.replace("    // Async log (non-blocking)\n", retention_comment)

with open('supabase/functions/jubee-conversation/index.ts', 'w') as f:
    f.write(content)
