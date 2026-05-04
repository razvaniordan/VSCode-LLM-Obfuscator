import type { PromptTemplate } from '../prompts/promptManager';

export type ObfuscationCategory = 'layout' | 'control' | 'data';
export type ObfuscationScope = 'file' | 'function';
export type FunctionalTestStrategy = 'none' | 'unit' | 'regression' | 'both';
export type FunctionalTestOutcome = 'passed' | 'failed' | 'inconclusive';

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
	runFunctionalTests?: boolean;
	maxRegressionTests?: number;
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

export interface ProviderFunctionalTestGenerationRequest {
	sourceCode: string;
	modelId: string;
	maxRegressionTests: number;
}

export interface ProviderFunctionalTestGenerationResponse {
	rawText: string;
	providerId: string;
	modelId: string;
	notes: string[];
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

export interface CompileChecks {
	original: CompileCheckResult;
	obfuscated: CompileCheckResult;
}

export interface ObfuscationResult {
	obfuscatedCode: string;
	reconstructedFullCode: string;
	providerId: string;
	modelId: string;
	category: ObfuscationCategory;
	scope: ObfuscationScope;
	promptVersion: string;
	compileChecks: CompileChecks;
	functionalTesting?: FunctionalTestingSummary;
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

export interface RegressionTestCase {
	name: string;
	args: string[];
	stdin: string;
	timeoutMs: number;
}

export interface AiFunctionalTestPlan {
	strategy: FunctionalTestStrategy;
	reason: string;
	unitTestHarnessCode?: string;
	regressionTests: RegressionTestCase[];
}

export interface ProgramRunResult {
	exitCode: number | null;
	stdout: string;
	stderr: string;
	timedOut: boolean;
	errorMessage?: string;
}

export interface RegressionTestCaseResult {
	name: string;
	args: string[];
	stdin: string;
	expected: ProgramRunResult;
	actual: ProgramRunResult;
	status: FunctionalTestOutcome;
	passed: boolean;
	reason?: string;
}

export interface RegressionTestReport {
	attempted: boolean;
	passed: boolean;
	testsGenerated: number;
	testsRun: number;
	testsPassed: number;
	testsFailed: number;
	testsInconclusive: number;
	originalBinaryPath?: string;
	obfuscatedBinaryPath?: string;
	results: RegressionTestCaseResult[];
	errorMessage?: string;
}

export interface UnitTestReport {
	attempted: boolean;
	status: FunctionalTestOutcome;
	passed: boolean;
	originalHarnessCompile: CompileCheckResult;
	obfuscatedHarnessCompile: CompileCheckResult;
	originalRun?: ProgramRunResult;
	obfuscatedRun?: ProgramRunResult;
	harnessFilePath?: string;
	errorMessage?: string;
}

export interface FunctionalTestingSummary {
	enabled: boolean;
	attempted: boolean;
	strategy: FunctionalTestStrategy;
	passed: boolean;
	testPlanFilePath?: string;
	unitTests?: {
		attempted: boolean;
		status: FunctionalTestOutcome;
		passed: boolean;
		reportFilePath?: string;
	};
	regressionTests?: {
		attempted: boolean;
		passed: boolean;
		testsRun: number;
		testsPassed: number;
		testsFailed: number;
		testsInconclusive: number;
		reportFilePath?: string;
	};
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
	compileChecks: CompileChecks;
	functionalTesting?: FunctionalTestingSummary;
}