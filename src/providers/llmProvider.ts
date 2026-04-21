import { ProviderGenerateRequest, ProviderGenerateResponse } from '../core/types';

export interface LLMProvider {
	readonly providerId: string;
	generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse>;
}