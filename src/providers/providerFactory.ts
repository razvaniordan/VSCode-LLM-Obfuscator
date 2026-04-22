import { LLMProvider } from './llmProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openaiProvider';
import { ClaudeProvider } from './claudeProvider';
import { GeminiProvider } from './geminiProvider';

export class ProviderFactory {
	public static create(providerId: string): LLMProvider {
		switch (providerId) {
			case 'mock':
				return new MockProvider();
			case 'openai':
				return new OpenAIProvider();
			case 'claude':
				return new ClaudeProvider();
			case 'gemini':
				return new GeminiProvider();
			default:
				throw new Error(`Unsupported provider: ${providerId}`);
		}
	}
}