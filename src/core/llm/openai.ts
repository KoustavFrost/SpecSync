import OpenAI from 'openai';
import type { DiffAnalysisResult, LLMProvider, SupportedLLMProvider } from '../types.js';
import { buildAnalysisPrompt, SYSTEM_PROMPT } from './prompt.js';

export class OpenAICompatibleProvider implements LLMProvider {
  name: SupportedLLMProvider;
  private client: OpenAI;
  private model: string;

  constructor(
    provider: 'openai' | 'groq',
    apiKey: string,
    model?: string
  ) {
    this.name = provider;
    if (provider === 'groq') {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.model = model || 'llama-3.3-70b-versatile';
    } else {
      this.client = new OpenAI({ apiKey });
      this.model = model || 'gpt-4o-mini';
    }
  }

  async analyzeDiff(diffContent: string, currentSpec?: string): Promise<DiffAnalysisResult> {
    const prompt = buildAnalysisPrompt([{ filename: 'diff', patch: diffContent }], currentSpec);

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content || '{}';
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
