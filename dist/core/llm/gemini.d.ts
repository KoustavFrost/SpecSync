import type { DiffAnalysisResult, LLMProvider } from '../types.js';
export declare class GeminiProvider implements LLMProvider {
    name: "gemini";
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    analyzeDiff(diffContent: string, currentSpec?: string): Promise<DiffAnalysisResult>;
}
//# sourceMappingURL=gemini.d.ts.map