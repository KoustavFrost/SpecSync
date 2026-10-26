import { GeminiProvider } from './gemini.js';
import { OpenAICompatibleProvider } from './openai.js';
export function createLLMProvider(config) {
    const { provider, apiKey, model } = config.llm;
    if (!apiKey) {
        throw new Error(`Missing API Key for provider "${provider}". Please set GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY in your environment/secrets.`);
    }
    switch (provider) {
        case 'gemini':
            return new GeminiProvider(apiKey, model);
        case 'openai':
            return new OpenAICompatibleProvider('openai', apiKey, model);
        case 'groq':
            return new OpenAICompatibleProvider('groq', apiKey, model);
        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}
//# sourceMappingURL=index.js.map