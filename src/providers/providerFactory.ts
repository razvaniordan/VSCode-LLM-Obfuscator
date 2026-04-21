import { LLMProvider } from './llmProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openaiProvider';

export class ProviderFactory {
	public static create(providerId: string): LLMProvider {
		switch (providerId) {
			case 'mock':
				return new MockProvider();
			case 'openai':
				return new OpenAIProvider();
			default:
				throw new Error(`Unsupported provider: ${providerId}`);
		}
	}
}