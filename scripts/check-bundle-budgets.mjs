import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const ALLOWLIST_PATH = path.join(process.cwd(), 'docs/performance/bundle-budget-allowlist.json');
const DIST_PATH = path.join(process.cwd(), 'dist');
const ASSETS_PATH = path.join(DIST_PATH, 'assets');

let allowlist = { mainThreshold: 1.05, lazyLimitRaw: 102400, lazyRouteLimitRaw: 204800, allowlistedChunks: [] };
if (fs.existsSync(ALLOWLIST_PATH)) {
    allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
}

const report = {
    timestamp: new Date().toISOString(),
    chunks: []
};

let hasError = false;

if (!fs.existsSync(ASSETS_PATH)) {
    console.error("No dist/assets directory found. Did you run build?");
    process.exit(1);
}

const files = fs.readdirSync(ASSETS_PATH).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(ASSETS_PATH, file);
    const content = fs.readFileSync(filePath);
    const rawSize = content.length;
    const gzipSize = zlib.gzipSync(content).length;

    report.chunks.push({
        file,
        rawSize,
        gzipSize
    });

    if (file.includes('vendor-three') || file.includes('index-')) {
        // baseline check - hardcoded baseline assumption or skip
    }

    if (rawSize > allowlist.lazyLimitRaw) {
        if (!allowlist.allowlistedChunks.some(ac => file.startsWith(ac.prefix))) {
            console.error(`Chunk ${file} exceeds lazy limit (${rawSize} > ${allowlist.lazyLimitRaw}) and is not allowlisted.`);
            hasError = true;
        }
    }
});

fs.mkdirSync(path.join(process.cwd(), 'docs/reports'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'docs/reports/bundle-budget-report.json'), JSON.stringify(report, null, 2));

let md = '# Bundle Budget Report\n\n';
md += `Generated: ${report.timestamp}\n\n`;
md += '| Chunk | Raw Size (B) | Gzip Size (B) |\n';
md += '|---|---|---|\n';
report.chunks.sort((a,b) => b.rawSize - a.rawSize).forEach(c => {
    md += `| ${c.file} | ${c.rawSize} | ${c.gzipSize} |\n`;
});

fs.writeFileSync(path.join(process.cwd(), 'docs/reports/bundle-budget-report.md'), md);

if (hasError) {
    process.exit(1);
} else {
    console.log("Bundle budgets look okay based on allowlist.");
}
