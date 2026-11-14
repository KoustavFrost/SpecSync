import path from 'node:path';
const BACKEND_EXTENSIONS = new Set([
    '.ts',
    '.js',
    '.mjs',
    '.cjs',
    '.py',
    '.go',
    '.java',
    '.rb',
    '.rs',
    '.php',
    '.cs',
    '.scala',
    '.kt',
    '.proto',
]);
/**
 * Checks if a file path is potentially a backend / API route / controller / model file
 */
export function isRelevantFile(filePath, ignorePatterns = []) {
    const normalized = filePath.replace(/\\/g, '/');
    const ext = path.extname(normalized).toLowerCase();
    if (!BACKEND_EXTENSIONS.has(ext)) {
        return false;
    }
    // Check test files
    if (normalized.includes('.test.') ||
        normalized.includes('.spec.') ||
        normalized.includes('__tests__') ||
        normalized.includes('/tests/') ||
        normalized.includes('/test/')) {
        return false;
    }
    // Check custom ignore patterns
    for (const pattern of ignorePatterns) {
        const cleanPattern = pattern.replace(/\*\*/g, '').replace(/\*/g, '');
        if (cleanPattern && normalized.includes(cleanPattern)) {
            return false;
        }
    }
    return true;
}
export function filterRelevantDiffs(files, ignorePatterns = []) {
    return files
        .filter((f) => isRelevantFile(f.filename, ignorePatterns) && Boolean(f.patch))
        .map((f) => ({ filename: f.filename, patch: f.patch }));
}
/**
 * Parses a raw git unified diff output into file chunks and filters out non-backend files
 */
export function parseAndFilterUnifiedDiff(rawDiff, ignorePatterns = []) {
    if (!rawDiff || rawDiff.trim().length === 0) {
        return { filteredDiff: '', matchedFiles: [] };
    }
    // Split by unified diff header
    const chunks = rawDiff.split(/(?=^diff --git )/m);
    const relevantChunks = [];
    const matchedFiles = [];
    for (const chunk of chunks) {
        if (!chunk.trim())
            continue;
        const firstLine = chunk.split('\n')[0] || '';
        // e.g. "diff --git a/src/routes.ts b/src/routes.ts"
        const match = firstLine.match(/b\/(.+)$/);
        const filename = match ? match[1].trim() : '';
        if (filename && isRelevantFile(filename, ignorePatterns)) {
            relevantChunks.push(chunk);
            matchedFiles.push(filename);
        }
    }
    // If no "diff --git" headers were matched (e.g. custom patch file without headers), fallback to raw diff
    if (relevantChunks.length === 0 && !rawDiff.includes('diff --git')) {
        return { filteredDiff: rawDiff, matchedFiles: ['custom-diff'] };
    }
    return {
        filteredDiff: relevantChunks.join(''),
        matchedFiles,
    };
}
//# sourceMappingURL=filter.js.map