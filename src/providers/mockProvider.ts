import { ProviderGenerateRequest, ProviderGenerateResponse } from '../core/types';
import { LLMProvider } from './llmProvider';

export class MockProvider implements LLMProvider {
	public readonly providerId = 'mock';

	public async generate(
		request: ProviderGenerateRequest
	): Promise<ProviderGenerateResponse> {
		let code = request.sourceCode;

		// Remove line comments in a naive way
		code = code.replace(/\/\/.*$/gm, '');

		// Slight whitespace normalization
		code = code
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.join('\n');

		if (request.category === 'layout') {
			code = code
				.replace(/\bcounter\b/g, 'x1')
				.replace(/\bresult\b/g, 'x2')
				.replace(/\btemp\b/g, 'x3');
		}

		if (request.category === 'control') {
			code = `/* mock-control-obfuscation */\n${code}`;
		}

		if (request.category === 'data') {
			code = `/* mock-data-obfuscation */\n${code}`;
		}

		return {
			rawText: code,
			providerId: this.providerId,
			modelId: request.modelId,
			notes: [
				'Mock provider executed.',
				`Prompt version used: ${request.prompt.version}`,
				`Category: ${request.category}`
			]
		};
	}
}