import type { DiffAnalysisResult, LLMProvider, SupportedLLMProvider } from '../types.js';
export declare class OpenAICompatibleProvider implements LLMProvider {
    name: SupportedLLMProvider;
    private client;
    private model;
    constructor(provider: 'openai' | 'groq', apiKey: string, model?: string);
    analyzeDiff(diffContent: string, currentSpec?: string): Promise<DiffAnalysisResult>;
}
//# sourceMappingURL=openai.d.ts.map