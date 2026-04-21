import {
	ObfuscationRequest,
	ObfuscationResult
} from './types';
import { ProviderFactory } from '../providers/providerFactory';
import { PromptManager } from '../prompts/promptManager';
import { ResultNormalizer } from './resultNormalizer';

export class ObfuscationOrchestrator {
	private readonly promptManager = new PromptManager();
	private readonly resultNormalizer = new ResultNormalizer();

	public async run(request: ObfuscationRequest): Promise<ObfuscationResult> {
		const provider = ProviderFactory.create(request.providerId);
		const prompt = this.promptManager.load(request.category);

		const providerResponse = await provider.generate({
			sourceCode: request.sourceCode,
			category: request.category,
			prompt,
			modelId: request.modelId
		});

		const normalized = this.resultNormalizer.normalize(providerResponse.rawText);

		return {
			obfuscatedCode: normalized.code,
			providerId: providerResponse.providerId,
			modelId: providerResponse.modelId,
			category: request.category,
			promptVersion: prompt.version,
			notes: [...providerResponse.notes, ...normalized.warnings]
		};
	}
}