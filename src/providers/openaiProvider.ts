import OpenAI from 'openai';
import { ProviderGenerateRequest, ProviderGenerateResponse } from '../core/types';
import { LLMProvider } from './llmProvider';
import { getRequiredEnv } from '../config/env';

export class OpenAIProvider implements LLMProvider {
	public readonly providerId = 'openai';

	public async generate(
		request: ProviderGenerateRequest
	): Promise<ProviderGenerateResponse> {
		const apiKey = getRequiredEnv('OPENAI_API_KEY');

		const client = new OpenAI({apiKey});

		const composedInput = [
			request.prompt.text,
			'',
			'Source C code to transform:',
			'```c',
			request.sourceCode,
			'```',
			'',
			'Return only the transformed C code.'
		].join('\n');

		const response = await client.responses.create({
			model: request.modelId,
			input: composedInput
		});

		const outputText = response.output_text?.trim();

		if (!outputText) {
			throw new Error('OpenAI returned an empty text response.');
		}

		return {
			rawText: outputText,
			providerId: this.providerId,
			modelId: request.modelId,
			notes: [
				'OpenAI provider executed.',
				`Prompt version used: ${request.prompt.version}`,
				`Category: ${request.category}`
			]
		};
	}
}