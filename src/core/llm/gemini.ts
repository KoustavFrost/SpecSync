import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DiffAnalysisResult, LLMProvider } from '../types.js';
import { buildAnalysisPrompt, SYSTEM_PROMPT } from './prompt.js';

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 2000
): Promise<T> {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const errorStr = String(err);
      const isTransient =
        errorStr.includes('503') ||
        errorStr.includes('429') ||
        errorStr.includes('high demand') ||
        errorStr.includes('resource exhausted') ||
        errorStr.includes('ResourceExhausted') ||
        errorStr.includes('fetch failed') ||
        errorStr.includes('ECONNRESET') ||
        errorStr.includes('ETIMEDOUT');

      if (attempt < maxRetries && isTransient) {
        console.warn(
          `⏳ [SpecSync] Model capacity busy (503/429). Retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

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

    const response = await callWithRetry(async () => {
      return await generativeModel.generateContent(prompt);
    });
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
