const fs = require('fs');
const file = 'supabase/functions/jubee-conversation/index.ts';
let src = fs.readFileSync(file, 'utf8');

if (!src.includes('const safetyCheck = checkSafety(prompt);')) {
    const toReplace = `if (!prompt || typeof prompt !== 'string') {
      throw new Error("Invalid request payload. Please ensure 'prompt' is a string.");
    }`;
    const replacement = toReplace + `

    if (prompt.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Message too long");
    }

    const safetyCheck = checkSafety(prompt);
    if (!safetyCheck.isSafe) {
        return new Response(JSON.stringify({ response: SAFE_FALLBACKS[safetyCheck.reason || 'default'], isFallback: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
`;
    src = src.replace(toReplace, replacement);
    fs.writeFileSync(file, src);
}
