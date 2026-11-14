/**
 * Checks if a file path is potentially a backend / API route / controller / model file
 */
export declare function isRelevantFile(filePath: string, ignorePatterns?: string[]): boolean;
export declare function filterRelevantDiffs(files: Array<{
    filename: string;
    patch?: string;
}>, ignorePatterns?: string[]): Array<{
    filename: string;
    patch: string;
}>;
/**
 * Parses a raw git unified diff output into file chunks and filters out non-backend files
 */
export declare function parseAndFilterUnifiedDiff(rawDiff: string, ignorePatterns?: string[]): {
    filteredDiff: string;
    matchedFiles: string[];
};
//# sourceMappingURL=filter.d.ts.map