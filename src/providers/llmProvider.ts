import { ProviderGenerateRequest, ProviderGenerateResponse, ProviderFunctionalTestGenerationRequest, ProviderFunctionalTestGenerationResponse } from '../core/types';

export interface LLMProvider {
	readonly providerId: string;

	generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse>;

	generateFunctionalTests(request: ProviderFunctionalTestGenerationRequest): Promise<ProviderFunctionalTestGenerationResponse>;
}