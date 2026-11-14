import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
export const DEFAULT_CONFIG = {
    spec: {
        path: 'openapi.yaml',
        format: 'openapi_3.1',
        autoCreate: true,
    },
    docs: {
        enabled: true,
        path: 'API.md',
    },
    llm: {
        provider: 'gemini',
        model: 'gemini-3.8-flash',
    },
    delivery: {
        mode: 'commit',
        commitMessage: 'chore(api): update openapi spec and documentation [skip ci]',
        authorName: 'spec-sync[bot]',
        authorEmail: 'spec-sync[bot]@users.noreply.github.com',
    },
    ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/*.lock',
        '**/package-lock.json',
        '**/pnpm-lock.yaml',
        '**/yarn.lock',
        '**/*.md',
        '**/*.css',
        '**/*.scss',
        '**/*.html',
        '**/*.svg',
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.ico',
        '**/*.test.*',
        '**/*.spec.*',
        '**/tests/**',
        '**/test/**',
    ],
};
const POSSIBLE_CONFIG_FILES = [
    '.github/api-bot.yml',
    '.github/api-bot.yaml',
    '.github/spec-sync.yml',
    '.github/spec-sync.yaml',
    '.spec-sync.yml',
    '.spec-sync.yaml',
];
/**
 * Loads configuration from file if present, falling back to zero-config defaults.
 */
export function loadConfig(cwd = process.cwd()) {
    let fileConfig = {};
    for (const relativePath of POSSIBLE_CONFIG_FILES) {
        const fullPath = path.join(cwd, relativePath);
        if (fs.existsSync(fullPath)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                fileConfig = YAML.parse(content) || {};
                break;
            }
            catch (err) {
                console.warn(`Failed to parse configuration at ${relativePath}:`, err);
            }
        }
    }
    // Detect available API keys in environment if not explicitly set
    let detectedProvider = 'gemini';
    let detectedKey = undefined;
    const detectedModel = process.env.GEMINI_MODEL || process.env.LLM_MODEL || process.env.OPENAI_MODEL;
    if (process.env.GEMINI_API_KEY) {
        detectedProvider = 'gemini';
        detectedKey = process.env.GEMINI_API_KEY;
    }
    else if (process.env.OPENAI_API_KEY) {
        detectedProvider = 'openai';
        detectedKey = process.env.OPENAI_API_KEY;
    }
    else if (process.env.GROQ_API_KEY) {
        detectedProvider = 'groq';
        detectedKey = process.env.GROQ_API_KEY;
    }
    // Auto-discover existing spec files in root or docs/ directory
    const candidateSpecPaths = [
        'openapi.yaml',
        'openapi.json',
        'docs/openapi.yaml',
        'docs/openapi.json',
        'swagger.yaml',
        'swagger.json',
        'docs/swagger.yaml',
        'docs/swagger.json',
    ];
    let autoDetectedSpecPath = 'openapi.yaml';
    for (const candidate of candidateSpecPaths) {
        if (fs.existsSync(path.join(cwd, candidate))) {
            autoDetectedSpecPath = candidate;
            break;
        }
    }
    // Auto-discover existing doc files in root or docs/ directory
    const candidateDocPaths = ['API.md', 'docs/API.md', 'docs/api.md', 'api.md'];
    let autoDetectedDocPath = 'API.md';
    for (const candidate of candidateDocPaths) {
        if (fs.existsSync(path.join(cwd, candidate))) {
            autoDetectedDocPath = candidate;
            break;
        }
    }
    return {
        spec: {
            ...DEFAULT_CONFIG.spec,
            path: fileConfig.spec?.path || autoDetectedSpecPath,
            ...(fileConfig.spec || {}),
        },
        docs: {
            ...DEFAULT_CONFIG.docs,
            path: fileConfig.docs?.path || autoDetectedDocPath,
            ...(fileConfig.docs || {}),
        },
        llm: {
            provider: fileConfig.llm?.provider || detectedProvider,
            model: fileConfig.llm?.model ||
                detectedModel ||
                (detectedProvider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4o-mini'),
            apiKey: fileConfig.llm?.apiKey || detectedKey,
        },
        delivery: {
            ...DEFAULT_CONFIG.delivery,
            ...(fileConfig.delivery || {}),
        },
        ignorePatterns: [
            ...DEFAULT_CONFIG.ignorePatterns,
            ...(fileConfig.ignorePatterns || []),
        ],
    };
}
//# sourceMappingURL=config.js.map