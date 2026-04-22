import { PromptTemplate } from '../prompts/promptManager';

export type ObfuscationCategory = 'layout' | 'control' | 'data';
export type ObfuscationScope = 'file' | 'function';

export interface ObfuscationRequest {
	sourceCode: string;
	fullDocumentCode: string;
	category: ObfuscationCategory;
	scope: ObfuscationScope;
	providerId: string;
	modelId: string;
	selectionStartOffset?: number;
	selectionEndOffset?: number;
	selectionStartLine?: number;
	selectionEndLine?: number;
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
	reconstructedFullCode: string;
	providerId: string;
	modelId: string;
	category: ObfuscationCategory;
	scope: ObfuscationScope;
	promptVersion: string;
	notes: string[];
	runId?: string;
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
	scope: ObfuscationScope;
	promptVersion: string;
	sourceLengthChars: number;
	obfuscatedLengthChars: number;
	sourceFilePath: string;
	obfuscatedFilePath: string;
	notes: string[];
	selectionStartOffset?: number;
	selectionEndOffset?: number;
	selectionStartLine?: number;
	selectionEndLine?: number;
	sanityCheck: SanityCheckResult;
	compileCheck: CompileCheckResult;
}