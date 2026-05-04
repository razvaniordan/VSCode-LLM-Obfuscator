import { CompileChecks, ExperimentRecord, FunctionalTestingSummary, ObfuscationRequest, ObfuscationResult, RegressionTestReport, SanityCheckResult, UnitTestReport } from './types';
import { ProviderFactory } from '../providers/providerFactory';
import { PromptManager } from '../prompts/promptManager';
import { ResultNormalizer } from './resultNormalizer';
import { CSanityCheck } from '../validation/cSanityCheck';
import { CompileCheck } from '../validation/compileCheck';
import { ExperimentLogger } from '../logging/experimentLogger';
import { makeRunId, makeTimestamp } from '../util/time';
import { getGlobalStoragePath } from '../services/appPaths';
import { AiFunctionalTestPlanParser } from '../validation/aiFunctionalTestPlanParser';
import { FunctionalTestRunner } from '../validation/functionalTestRunner';

export class ObfuscationOrchestrator {
	private readonly promptManager = new PromptManager();
	private readonly resultNormalizer = new ResultNormalizer();
	private readonly sanityCheck = new CSanityCheck();
	private readonly compileCheck = new CompileCheck();
	private readonly experimentLogger = new ExperimentLogger(getGlobalStoragePath());
	private readonly aiTestPlanParser = new AiFunctionalTestPlanParser();
	private readonly functionalTestRunner = new FunctionalTestRunner();

	public async run(request: ObfuscationRequest): Promise<ObfuscationResult> {
		const runId = makeRunId();
		const timestamp = makeTimestamp();

		const originalCompileCheck = this.compileCheck.compileSourceCode(
			request.fullDocumentCode,
			`${runId}-original`
		);

		if (!originalCompileCheck.succeeded) {
			const errorDetails = originalCompileCheck.stderr
				? `\n\nCompiler stderr:\n${originalCompileCheck.stderr}`
				: '';

			throw new Error(`Original source code does not compile. Obfuscation was cancelled.${errorDetails}`);
		}

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

		const obfuscatedCompileCheck = this.compileCheck.compileSourceCode(
			reconstructedFullCode,
			`${runId}-obfuscated`
		);

		const compileChecks: CompileChecks = {
			original: originalCompileCheck,
			obfuscated: obfuscatedCompileCheck
		};

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

		const functionalTesting = await this.runFunctionalTestingIfRequested(
			request,
			provider,
			runId,
			reconstructedFullCode,
			compileChecks,
			notes
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
			compileChecks,
			functionalTesting
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
			compileChecks,
			functionalTesting,
			notes: [
				...notes,
				`Run ID: ${runId}`,
				`Original compile success: ${compileChecks.original.succeeded}`,
				`Obfuscated compile success: ${compileChecks.obfuscated.succeeded}`,
				`Functional testing enabled: ${functionalTesting.enabled}`,
				`Functional testing passed: ${functionalTesting.passed}`
			]
		};
	}

	private async runFunctionalTestingIfRequested(
		request: ObfuscationRequest,
		provider: ReturnType<typeof ProviderFactory.create>,
		runId: string,
		reconstructedFullCode: string,
		compileChecks: CompileChecks,
		notes: string[]
	): Promise<FunctionalTestingSummary> {
		if (!request.runFunctionalTests) {
			return {
				enabled: false,
				attempted: false,
				strategy: 'none',
				passed: false
			};
		}

		if (!compileChecks.obfuscated.succeeded) {
			const summary: FunctionalTestingSummary = {
				enabled: true,
				attempted: false,
				strategy: 'none',
				passed: false,
				errorMessage: 'Skipped because obfuscated source code did not compile.'
			};

			if (summary.errorMessage) {
				notes.push(summary.errorMessage);
			}
			return summary;
		}

		if (!compileChecks.original.outputBinaryPath || !compileChecks.obfuscated.outputBinaryPath) {
			const summary: FunctionalTestingSummary = {
				enabled: true,
				attempted: false,
				strategy: 'none',
				passed: false,
				errorMessage: 'Skipped because one of the compiled binary paths is missing.'
			};

			if (summary.errorMessage) {
				notes.push(summary.errorMessage);
			}
			return summary;
		}

		try {
			const testGenerationResponse = await provider.generateFunctionalTests({
				sourceCode: request.fullDocumentCode,
				modelId: request.modelId,
				maxRegressionTests: request.maxRegressionTests ?? 5
			});

			const testPlan = this.aiTestPlanParser.parse(testGenerationResponse.rawText);

			let unitReport: UnitTestReport | undefined;
			let regressionReport: RegressionTestReport | undefined;

			if (testPlan.strategy === 'unit' || testPlan.strategy === 'both') {
				unitReport = this.functionalTestRunner.runUnitTests(
					request.fullDocumentCode,
					reconstructedFullCode,
					testPlan,
					runId
				);
			}

			if (testPlan.strategy === 'regression' || testPlan.strategy === 'both') {
				regressionReport = this.functionalTestRunner.runRegressionTests(
					compileChecks.original.outputBinaryPath,
					compileChecks.obfuscated.outputBinaryPath,
					testPlan
				);
			}

			const functionalArtifactPaths =
				this.experimentLogger.saveFunctionalTestingArtifacts(
					runId,
					testPlan,
					unitReport,
					regressionReport
				);

			const unitRequired = testPlan.strategy === 'unit' || testPlan.strategy === 'both';
			const regressionRequired =
				testPlan.strategy === 'regression' || testPlan.strategy === 'both';

			const unitPassed = !unitRequired || unitReport?.status === 'passed';
			const regressionPassed = !regressionRequired || (Boolean(regressionReport?.passed) && (regressionReport?.testsInconclusive ?? 0) === 0);

			const passed = testPlan.strategy !== 'none' && unitPassed && regressionPassed;

			const summary: FunctionalTestingSummary = {
				enabled: true,
				attempted: true,
				strategy: testPlan.strategy,
				passed,
				testPlanFilePath: functionalArtifactPaths.testPlanFilePath,
				unitTests: unitReport
				? {
						attempted: unitReport.attempted,
						status: unitReport.status,
						passed: unitReport.passed,
						reportFilePath: functionalArtifactPaths.unitReportFilePath
					}
				: undefined,
				regressionTests: regressionReport
					? {
							attempted: regressionReport.attempted,
							passed: regressionReport.passed,
							testsRun: regressionReport.testsRun,
							testsPassed: regressionReport.testsPassed,
							testsFailed: regressionReport.testsFailed,
							testsInconclusive: regressionReport.testsInconclusive,
							reportFilePath: functionalArtifactPaths.regressionReportFilePath
						}
					: undefined
			};

			notes.push(
				...testGenerationResponse.notes,
				`Functional testing strategy: ${testPlan.strategy}`,
				`Functional testing passed: ${summary.passed}`,
				`Regression inconclusive tests: ${regressionReport?.testsInconclusive ?? 0}`,
				`Unit test status: ${unitReport?.status ?? 'not-run'}`
			);

			return summary;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown functional testing error';

			const summary: FunctionalTestingSummary = {
				enabled: true,
				attempted: true,
				strategy: 'none',
				passed: false,
				errorMessage: message
			};

			notes.push(`Functional testing failed: ${message}`);
			return summary;
		}
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