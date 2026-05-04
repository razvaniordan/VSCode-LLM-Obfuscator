import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import {
	AiFunctionalTestPlan,
	FunctionalTestOutcome,
	ProgramRunResult,
	RegressionTestCaseResult,
	RegressionTestReport,
	UnitTestReport
} from '../core/types';
import { CompileCheck } from './compileCheck';

export class FunctionalTestRunner {
	private readonly compileCheck = new CompileCheck();

	public runUnitTests(
		originalSourceCode: string,
		obfuscatedSourceCode: string,
		testPlan: AiFunctionalTestPlan,
		runId: string
	): UnitTestReport {
		if (!testPlan.unitTestHarnessCode) {
			return {
				attempted: false,
				status: 'inconclusive',
				passed: false,
				originalHarnessCompile: this.compileCheck.notAttempted(),
				obfuscatedHarnessCompile: this.compileCheck.notAttempted(),
				errorMessage: 'No unit test harness was generated.'
			};
		}

		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-c-unit-tests-'));

		const originalDir = path.join(tempDir, 'original');
		const obfuscatedDir = path.join(tempDir, 'obfuscated');

		fs.mkdirSync(originalDir, { recursive: true });
		fs.mkdirSync(obfuscatedDir, { recursive: true });

		const originalHarnessPath = path.join(originalDir, 'unit-test-harness.c');
		const obfuscatedHarnessPath = path.join(obfuscatedDir, 'unit-test-harness.c');

		fs.writeFileSync(originalHarnessPath, testPlan.unitTestHarnessCode, 'utf8');
		fs.writeFileSync(obfuscatedHarnessPath, testPlan.unitTestHarnessCode, 'utf8');

		fs.writeFileSync(path.join(originalDir, 'candidate.c'), originalSourceCode, 'utf8');
		fs.writeFileSync(path.join(obfuscatedDir, 'candidate.c'), obfuscatedSourceCode, 'utf8');

		const originalBinaryPath = path.join(
			originalDir,
			process.platform === 'win32'
				? `${runId}-unit-original.exe`
				: `${runId}-unit-original`
		);

		const obfuscatedBinaryPath = path.join(
			obfuscatedDir,
			process.platform === 'win32'
				? `${runId}-unit-obfuscated.exe`
				: `${runId}-unit-obfuscated`
		);

		const originalHarnessCompile = this.compileCheck.compileFile(
			originalHarnessPath,
			originalBinaryPath
		);

		const obfuscatedHarnessCompile = this.compileCheck.compileFile(
			obfuscatedHarnessPath,
			obfuscatedBinaryPath
		);

		if (!originalHarnessCompile.succeeded) {
			return {
				attempted: true,
				status: 'inconclusive',
				passed: false,
				originalHarnessCompile,
				obfuscatedHarnessCompile,
				harnessFilePath: originalHarnessPath,
				errorMessage: 'Original unit harness failed to compile, so the unit test is inconclusive.'
			};
		}

		if (!obfuscatedHarnessCompile.succeeded) {
			return {
				attempted: true,
				status: 'failed',
				passed: false,
				originalHarnessCompile,
				obfuscatedHarnessCompile,
				harnessFilePath: originalHarnessPath,
				errorMessage: 'Obfuscated unit harness failed to compile.'
			};
		}

		const originalRun = this.runProgram(originalBinaryPath, [], '', 10000);
		const obfuscatedRun = this.runProgram(obfuscatedBinaryPath, [], '', 10000);

		const comparison = this.compareUnitRuns(originalRun, obfuscatedRun);

		return {
			attempted: true,
			status: comparison.status,
			passed: comparison.status === 'passed',
			originalHarnessCompile,
			obfuscatedHarnessCompile,
			originalRun,
			obfuscatedRun,
			harnessFilePath: originalHarnessPath,
			errorMessage: comparison.reason
		};
	}

	public runRegressionTests(
		originalBinaryPath: string,
		obfuscatedBinaryPath: string,
		testPlan: AiFunctionalTestPlan
	): RegressionTestReport {
		const tests = testPlan.regressionTests;

		if (tests.length === 0) {
			return {
				attempted: false,
				passed: false,
				testsGenerated: 0,
				testsRun: 0,
				testsPassed: 0,
				testsFailed: 0,
				testsInconclusive: 0,
				originalBinaryPath,
				obfuscatedBinaryPath,
				results: [],
				errorMessage: 'No regression tests were generated.'
			};
		}

		const results: RegressionTestCaseResult[] = [];

		for (const testCase of tests) {
			const expected = this.runProgram(
				originalBinaryPath,
				testCase.args,
				testCase.stdin,
				10000
			);

			const actual = this.runProgram(
				obfuscatedBinaryPath,
				testCase.args,
				testCase.stdin,
				10000
			);

			const comparison = this.compareRegressionRuns(expected, actual);

			results.push({
				name: testCase.name,
				args: testCase.args,
				stdin: testCase.stdin,
				expected,
				actual,
				status: comparison.status,
				passed: comparison.status === 'passed',
				reason: comparison.reason
			});
		}

		const testsPassed = results.filter((result) => result.status === 'passed').length;
		const testsFailed = results.filter((result) => result.status === 'failed').length;
		const testsInconclusive = results.filter(
			(result) => result.status === 'inconclusive'
		).length;

		return {
			attempted: true,
			passed: testsFailed === 0 && testsInconclusive === 0,
			testsGenerated: tests.length,
			testsRun: results.length,
			testsPassed,
			testsFailed,
			testsInconclusive,
			originalBinaryPath,
			obfuscatedBinaryPath,
			results
		};
	}

	private runProgram(
		binaryPath: string,
		args: string[],
		stdin: string,
		timeoutMs: number
	): ProgramRunResult {
		const result = spawnSync(binaryPath, args, {
			input: stdin,
			encoding: 'utf8',
			timeout: timeoutMs
		});

		const timedOut = result.error?.message.includes('ETIMEDOUT') ?? false;

		return {
			exitCode: result.status,
			stdout: result.stdout ?? '',
			stderr: result.stderr ?? '',
			timedOut,
			errorMessage: result.error?.message
		};
	}

	private compareRegressionRuns(
		expected: ProgramRunResult,
		actual: ProgramRunResult
	): { status: FunctionalTestOutcome; reason?: string } {
		if (expected.timedOut) {
			return {
				status: 'inconclusive',
				reason: 'Original execution timed out, so no reliable oracle was produced.'
			};
		}

		if (expected.errorMessage) {
			return {
				status: 'inconclusive',
				reason: `Original execution failed: ${expected.errorMessage}`
			};
		}

		if (actual.timedOut) {
			return {
				status: 'failed',
				reason: 'Obfuscated execution timed out while original execution completed.'
			};
		}

		if (actual.errorMessage) {
			return {
				status: 'failed',
				reason: `Obfuscated execution failed: ${actual.errorMessage}`
			};
		}

		if (expected.exitCode !== actual.exitCode) {
			return {
				status: 'failed',
				reason: `Exit code mismatch: expected ${expected.exitCode}, got ${actual.exitCode}.`
			};
		}

		if (this.normalizeOutput(expected.stdout) !== this.normalizeOutput(actual.stdout)) {
			return {
				status: 'failed',
				reason: 'Stdout mismatch.'
			};
		}

		return {
			status: 'passed'
		};
	}

	private compareUnitRuns(
		originalRun: ProgramRunResult,
		obfuscatedRun: ProgramRunResult
	): { status: FunctionalTestOutcome; reason?: string } {
		if (originalRun.timedOut) {
			return {
				status: 'inconclusive',
				reason: 'Original unit harness execution timed out.'
			};
		}

		if (originalRun.errorMessage) {
			return {
				status: 'inconclusive',
				reason: `Original unit harness execution failed: ${originalRun.errorMessage}`
			};
		}

		if (originalRun.exitCode !== 0) {
			return {
				status: 'inconclusive',
				reason: `Original unit harness exited with non-zero code ${originalRun.exitCode}.`
			};
		}

		if (obfuscatedRun.timedOut) {
			return {
				status: 'failed',
				reason: 'Obfuscated unit harness execution timed out.'
			};
		}

		if (obfuscatedRun.errorMessage) {
			return {
				status: 'failed',
				reason: `Obfuscated unit harness execution failed: ${obfuscatedRun.errorMessage}`
			};
		}

		if (obfuscatedRun.exitCode !== 0) {
			return {
				status: 'failed',
				reason: `Obfuscated unit harness exited with non-zero code ${obfuscatedRun.exitCode}.`
			};
		}

		if (this.normalizeOutput(originalRun.stdout) !== this.normalizeOutput(obfuscatedRun.stdout)) {
			return {
				status: 'failed',
				reason: 'Unit harness stdout mismatch.'
			};
		}

		return {
			status: 'passed'
		};
	}

	private normalizeOutput(value: string): string {
		return value.replace(/\r\n/g, '\n').trimEnd();
	}
}