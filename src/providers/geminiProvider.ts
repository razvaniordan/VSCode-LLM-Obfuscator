import { ProviderGenerateRequest, ProviderGenerateResponse, ProviderFunctionalTestGenerationRequest, ProviderFunctionalTestGenerationResponse } from '../core/types';
import { buildFunctionalTestSystemText, buildFunctionalTestUserText } from '../prompts/functionalTestPromptBuilder';
import { LLMProvider } from './llmProvider';
import { getRequiredEnv } from '../config/env';

export class GeminiProvider implements LLMProvider {
	public readonly providerId = 'gemini';

	public async generate(
		request: ProviderGenerateRequest
	): Promise<ProviderGenerateResponse> {
		const apiKey = getRequiredEnv('GEMINI_API_KEY');

		const { GoogleGenAI } = await import('@google/genai');

		const ai = new GoogleGenAI({ apiKey });

		const prompt = [
			'SYSTEM INSTRUCTIONS:',
			'You are an expert C source-code obfuscation assistant.',
			'Your task is to transform the provided C code according to the requested obfuscation mode.',
			'Follow these rules strictly:',
			'1. Preserve the original behavior exactly.',
			'2. Return only valid C code.',
			'3. Do not include explanations, markdown or commentary.',
			'4. Do not introduce undefined behavior.',
			'5. Do not add external dependencies unless already present.',
			'6. Do not change public function signatures unless strictly necessary and explicitly requested.',
			'',
			'USER REQUEST:',
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

		const response = await ai.models.generateContent({
			model: request.modelId,
			contents: prompt
		});

		const outputText = response.text?.trim();

		if (!outputText) {
			throw new Error('Gemini returned an empty text response.');
		}

		return {
			rawText: outputText,
			providerId: this.providerId,
			modelId: request.modelId,
			notes: [
				'Gemini provider executed.',
				`Prompt version used: ${request.prompt.version}`,
				`Category: ${request.category}`
			]
		};
	}

	public async generateFunctionalTests(request: ProviderFunctionalTestGenerationRequest): Promise<ProviderFunctionalTestGenerationResponse> {
		const apiKey = getRequiredEnv('GEMINI_API_KEY');

		const { GoogleGenAI } = await import('@google/genai');

		const ai = new GoogleGenAI({ apiKey });

		const prompt = [
			'SYSTEM INSTRUCTIONS:',
			buildFunctionalTestSystemText(),
			'',
			'USER REQUEST:',
			buildFunctionalTestUserText(request.sourceCode, request.maxRegressionTests)
		].join('\n');

		const response = await ai.models.generateContent({
			model: request.modelId,
			contents: prompt
		});

		const outputText = response.text?.trim();

		if (!outputText) {
			throw new Error('Gemini returned an empty functional test response.');
		}

		return {
			rawText: outputText,
			providerId: this.providerId,
			modelId: request.modelId,
			notes: [
				'Gemini functional test generator executed.',
				`Requested max regression tests: ${request.maxRegressionTests}`
			]
		};
	}
}