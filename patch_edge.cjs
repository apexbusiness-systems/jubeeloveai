const fs = require('fs');
const file = 'supabase/functions/jubee-conversation/index.ts';
let src = fs.readFileSync(file, 'utf8');

const safetyFallback = `
const SAFE_FALLBACKS = {
  pii: "Let's keep private things private. Ask a grown-up to help!",
  self_harm: "I'm really glad you told me. Please get a trusted grown-up right now.",
  stranger: "I can't help with meeting people. Please ask your grown-up.",
  unsafe: "Let's choose a safe learning game together!",
  default: "Let's try a fun learning activity instead!"
} as const;

function checkSafety(text: string): { isSafe: boolean; reason?: keyof typeof SAFE_FALLBACKS } {
    const lower = text.toLowerCase();

    // Naive local PII / safety classifier
    if (/\\b\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b/.test(lower)) return { isSafe: false, reason: 'pii' }; // phone
    if (/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/.test(lower)) return { isSafe: false, reason: 'pii' }; // email

    if (lower.includes('hurt myself') || lower.includes('kill myself') || lower.includes('suicide') || lower.includes('die')) return { isSafe: false, reason: 'self_harm' };
    if (lower.includes('meet me') || lower.includes('where do you live') || lower.includes('what is your address')) return { isSafe: false, reason: 'stranger' };
    if (lower.includes('fuck') || lower.includes('shit') || lower.includes('bitch')) return { isSafe: false, reason: 'unsafe' };

    return { isSafe: true };
}
`;

if (!src.includes('SAFE_FALLBACKS')) {
    src = src.replace('const MAX_MESSAGE_LENGTH = 500;', 'const MAX_MESSAGE_LENGTH = 500;\n' + safetyFallback);
    fs.writeFileSync(file, src);
}
