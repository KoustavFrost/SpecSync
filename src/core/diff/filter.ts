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
export function isRelevantFile(filePath: string, ignorePatterns: string[] = []): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const ext = path.extname(normalized).toLowerCase();

  if (!BACKEND_EXTENSIONS.has(ext)) {
    return false;
  }

  // Check test files
  if (
    normalized.includes('.test.') ||
    normalized.includes('.spec.') ||
    normalized.includes('__tests__') ||
    normalized.includes('/tests/') ||
    normalized.includes('/test/')
  ) {
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

export function filterRelevantDiffs(
  files: Array<{ filename: string; patch?: string }>,
  ignorePatterns: string[] = []
): Array<{ filename: string; patch: string }> {
  return files
    .filter((f) => isRelevantFile(f.filename, ignorePatterns) && Boolean(f.patch))
    .map((f) => ({ filename: f.filename, patch: f.patch! }));
}
