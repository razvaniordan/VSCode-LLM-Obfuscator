import {
	CompileCheckResult,
	ExperimentRecord,
	ObfuscationRequest,
	ObfuscationResult,
	SanityCheckResult
} from './types';
import { ProviderFactory } from '../providers/providerFactory';
import { PromptManager } from '../prompts/promptManager';
import { ResultNormalizer } from './resultNormalizer';
import { CSanityCheck } from '../validation/cSanityCheck';
import { CompileCheck } from '../validation/compileCheck';
import { ExperimentLogger } from '../logging/experimentLogger';
import { makeRunId, makeTimestamp } from '../util/time';
import { getGlobalStoragePath } from '../services/appPaths';

export class ObfuscationOrchestrator {
	private readonly promptManager = new PromptManager();
	private readonly resultNormalizer = new ResultNormalizer();
	private readonly sanityCheck = new CSanityCheck();
	private readonly compileCheck = new CompileCheck();
	private readonly experimentLogger = new ExperimentLogger(getGlobalStoragePath());

	public async run(request: ObfuscationRequest): Promise<ObfuscationResult> {
		const runId = makeRunId();
		const timestamp = makeTimestamp();

		const provider = ProviderFactory.create(request.providerId);
		const prompt = this.promptManager.load(request.category);

		const providerResponse = await provider.generate({
			sourceCode: request.sourceCode,
			category: request.category,
			prompt,
			modelId: request.modelId
		});

		const normalized = this.resultNormalizer.normalize(providerResponse.rawText);
		const reconstructedFullCode = this.reconstructFullCode(request, normalized.code);
		const sanityCheckResult: SanityCheckResult = this.sanityCheck.run(normalized.code);
		const compileCheckResult: CompileCheckResult = this.compileCheck.run(reconstructedFullCode, runId);

		const notes = [
			...providerResponse.notes,
			...normalized.warnings,
			...sanityCheckResult.warnings
		];

		const artifactPaths = this.experimentLogger.saveCodeArtifacts(
			runId,
			request.fullDocumentCode,
			reconstructedFullCode
		);

		const record: ExperimentRecord = {
			runId,
			timestamp,
			providerId: providerResponse.providerId,
			modelId: providerResponse.modelId,
			category: request.category,
			scope: request.scope,
			promptVersion: prompt.version,
			sourceLengthChars: request.fullDocumentCode.length,
			obfuscatedLengthChars: reconstructedFullCode.length,
			sourceFilePath: artifactPaths.sourceFilePath,
			obfuscatedFilePath: artifactPaths.obfuscatedFilePath,
			notes,
			selectionStartOffset: request.selectionStartOffset,
			selectionEndOffset: request.selectionEndOffset,
			selectionStartLine: request.selectionStartLine,
			selectionEndLine: request.selectionEndLine,
			sanityCheck: sanityCheckResult,
			compileCheck: compileCheckResult
		};

		this.experimentLogger.saveRecord(record, artifactPaths.recordPath);

		return {
			obfuscatedCode: normalized.code,
			reconstructedFullCode,
			providerId: providerResponse.providerId,
			modelId: providerResponse.modelId,
			category: request.category,
			scope: request.scope,
			promptVersion: prompt.version,
			runId,
			notes: [
				...notes,
				`Run ID: ${runId}`,
				`Compile success: ${compileCheckResult.succeeded}`
			]
		};
	}

	private reconstructFullCode(request: ObfuscationRequest, transformedCode: string): string {
		if (request.scope === 'file') {
			return transformedCode;
		}

		if (
			request.selectionStartOffset === undefined ||
			request.selectionEndOffset === undefined
		) {
			throw new Error('Missing selection offsets for function-scope obfuscation.');
		}

		const before = request.fullDocumentCode.slice(0, request.selectionStartOffset);
		const after = request.fullDocumentCode.slice(request.selectionEndOffset);

		return `${before}${transformedCode}${after}`;
	}
}