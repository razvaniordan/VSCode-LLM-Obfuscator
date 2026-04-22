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

		const inputList = [
			{
				role: 'system' as const,
				content: [
					{
						type: 'input_text' as const,
						text: [
							'You are an expert C source-code obfuscation assistant.',
							'Your task is to transform the provided C code according to the requested obfuscation mode.',
							'Follow these rules strictly:',
							'1. Preserve the original behavior exactly.',
							'2. Return only valid C code.',
							'3. Do not include explanations, markdown or commentary.',
							'4. Do not introduce undefined behavior.',
							'5. Do not add external dependencies unless already present.',
							'6. Do not change public function signatures unless strictly necessary and explicitly requested.'
						].join('\n')
					}
				]
			},
			{
				role: 'user' as const,
				content: [
					{
						type: 'input_text' as const,
						text: [
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
						].join('\n')
					}
				]
			}
		];

		const response = await client.responses.create({
			model: request.modelId,
			input: inputList
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