/**
 * Core type definitions for SpecSync
 */
export type SupportedLLMProvider = 'gemini' | 'openai' | 'groq';
export interface SpecSyncConfig {
    spec: {
        path: string;
        format: 'openapi_3.1' | 'openapi_3.0';
        autoCreate: boolean;
    };
    docs: {
        enabled: boolean;
        path: string;
    };
    llm: {
        provider: SupportedLLMProvider;
        model?: string;
        apiKey?: string;
    };
    delivery: {
        mode: 'commit' | 'comment';
        commitMessage: string;
        authorName: string;
        authorEmail: string;
    };
    ignorePatterns: string[];
}
export interface EndpointParam {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    description?: string;
    schema?: Record<string, unknown>;
}
export interface EndpointDefinition {
    path: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: EndpointParam[];
    requestBody?: {
        description?: string;
        required?: boolean;
        content: Record<string, {
            schema: Record<string, unknown>;
        }>;
    };
    responses: Record<string, {
        description: string;
        content?: Record<string, {
            schema: Record<string, unknown>;
        }>;
    }>;
    isNew?: boolean;
    isModified?: boolean;
}
export interface DiffAnalysisResult {
    hasApiChanges: boolean;
    changedFiles: string[];
    endpoints: EndpointDefinition[];
    summary: string;
    breakingChanges: string[];
}
export interface LLMProvider {
    name: SupportedLLMProvider;
    analyzeDiff(diffContent: string, currentSpec?: string): Promise<DiffAnalysisResult>;
}
//# sourceMappingURL=types.d.ts.map