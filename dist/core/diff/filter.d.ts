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
//# sourceMappingURL=filter.d.ts.map