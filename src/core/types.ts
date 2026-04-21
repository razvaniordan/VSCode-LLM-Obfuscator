import { PromptTemplate } from '../prompts/promptManager';

export type ObfuscationCategory = 'layout' | 'control' | 'data';

export interface ObfuscationRequest {
	sourceCode: string;
	category: ObfuscationCategory;
	providerId: string;
	modelId: string;
}

export interface ProviderGenerateRequest {
	sourceCode: string;
	category: ObfuscationCategory;
	prompt: PromptTemplate;
	modelId: string;
}

export interface ProviderGenerateResponse {
	rawText: string;
	providerId: string;
	modelId: string;
	notes: string[];
}

export interface ObfuscationResult {
	obfuscatedCode: string;
	providerId: string;
	modelId: string;
	category: ObfuscationCategory;
	promptVersion: string;
	notes: string[];
}

export interface NormalizedCodeResult {
	code: string;
	warnings: string[];
}

export interface SanityCheckResult {
	passed: boolean;
	warnings: string[];
}

export interface CompileCheckResult {
	attempted: boolean;
	succeeded: boolean;
	compiler: string;
	commandLine: string;
	stdout: string;
	stderr: string;
	outputBinaryPath?: string;
	errorMessage?: string;
}

export interface ExperimentRecord {
	runId: string;
	timestamp: string;
	providerId: string;
	modelId: string;
	category: ObfuscationCategory;
	promptVersion: string;
	sourceLengthChars: number;
	obfuscatedLengthChars: number;
	sourceFilePath: string;
	obfuscatedFilePath: string;
	notes: string[];
	sanityCheck: SanityCheckResult;
	compileCheck: CompileCheckResult;
}