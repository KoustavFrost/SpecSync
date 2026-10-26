import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAnalysisPrompt, SYSTEM_PROMPT } from './prompt.js';
export class GeminiProvider {
    name = 'gemini';
    client;
    model;
    constructor(apiKey, model = 'gemini-1.5-flash') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }
    async analyzeDiff(diffContent, currentSpec) {
        const prompt = buildAnalysisPrompt([{ filename: 'diff', patch: diffContent }], currentSpec);
        const generativeModel = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });
        const response = await generativeModel.generateContent(prompt);
        const text = response.response.text() || '{}';
        try {
            const parsed = JSON.parse(text);
            return {
                hasApiChanges: Boolean(parsed.hasApiChanges),
                changedFiles: parsed.changedFiles || [],
                endpoints: parsed.endpoints || [],
                summary: parsed.summary || 'API specification synchronized.',
                breakingChanges: parsed.breakingChanges || [],
            };
        }
        catch {
            // Clean potential backticks if returned despite prompt
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                hasApiChanges: Boolean(parsed.hasApiChanges),
                changedFiles: parsed.changedFiles || [],
                endpoints: parsed.endpoints || [],
                summary: parsed.summary || 'API specification synchronized.',
                breakingChanges: parsed.breakingChanges || [],
            };
        }
    }
}
//# sourceMappingURL=gemini.js.map