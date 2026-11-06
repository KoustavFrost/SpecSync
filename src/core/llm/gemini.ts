import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DiffAnalysisResult, LLMProvider } from '../types.js';
import { buildAnalysisPrompt, SYSTEM_PROMPT } from './prompt.js';

export class GeminiProvider implements LLMProvider {
  name = 'gemini' as const;
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3.8-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async analyzeDiff(diffContent: string, currentSpec?: string): Promise<DiffAnalysisResult> {
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
      const parsed = JSON.parse(text) as DiffAnalysisResult;
      return {
        hasApiChanges: Boolean(parsed.hasApiChanges),
        changedFiles: parsed.changedFiles || [],
        endpoints: parsed.endpoints || [],
        summary: parsed.summary || 'API specification synchronized.',
        breakingChanges: parsed.breakingChanges || [],
      };
    } catch {
      // Clean potential backticks if returned despite prompt
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned) as DiffAnalysisResult;
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
