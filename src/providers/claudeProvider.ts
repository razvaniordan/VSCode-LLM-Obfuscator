import Anthropic from '@anthropic-ai/sdk';
import { ProviderGenerateRequest, ProviderGenerateResponse } from '../core/types';
import { LLMProvider } from './llmProvider';
import { getRequiredEnv } from '../config/env';

export class ClaudeProvider implements LLMProvider {
	public readonly providerId = 'claude';

	public async generate(
		request: ProviderGenerateRequest
	): Promise<ProviderGenerateResponse> {
		const apiKey = getRequiredEnv('ANTHROPIC_API_KEY');

		const client = new Anthropic({
			apiKey
		});

		const systemPrompt = [
			'You are an expert C source-code obfuscation assistant.',
			'Your task is to transform the provided C code according to the requested obfuscation mode.',
			'Follow these rules strictly:',
			'1. Preserve the original behavior exactly.',
			'2. Return only valid C code.',
			'3. Do not include explanations, markdown or commentary.',
			'4. Do not introduce undefined behavior.',
			'5. Do not add external dependencies unless already present.',
			'6. Do not change public function signatures unless strictly necessary and explicitly requested.'
		].join('\n');

		const userPrompt = [
			`Obfuscation mode: ${request.category}`,
			'',
			'Transformation policy:',
			request.prompt.text,
			'',
			'Source C code:',
			'```c',
			request.sourceCode,
			'```',
			'',
			'Return only the transformed C code.'
		].join('\n');

		const response = await client.messages.create({
			model: request.modelId,
			max_tokens: 4000,
			system: systemPrompt,
			messages: [
				{
					role: 'user',
					content: userPrompt
				}
			]
		});

		const outputText = response.content
			.filter((block) => block.type === 'text')
			.map((block) => block.text)
			.join('\n')
			.trim();

		if (!outputText) {
			throw new Error('Claude returned an empty text response.');
		}

		return {
			rawText: outputText,
			providerId: this.providerId,
			modelId: request.modelId,
			notes: [
				'Claude provider executed.',
				`Prompt version used: ${request.prompt.version}`,
				`Category: ${request.category}`
			]
		};
	}
}