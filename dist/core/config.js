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
        model: 'gemini-2.0-flash',
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
    return {
        spec: {
            ...DEFAULT_CONFIG.spec,
            ...(fileConfig.spec || {}),
        },
        docs: {
            ...DEFAULT_CONFIG.docs,
            ...(fileConfig.docs || {}),
        },
        llm: {
            provider: fileConfig.llm?.provider || detectedProvider,
            model: fileConfig.llm?.model || (detectedProvider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini'),
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