import * as path from 'path';
import {
	AiFunctionalTestPlan,
	ExperimentRecord,
	RegressionTestReport,
	UnitTestReport
} from '../core/types';
import { ensureDirectoryExists, writeJsonFile, writeTextFile } from '../util/fs';

export interface LoggedArtifactPaths {
	runDir: string;
	recordPath: string;
	sourceFilePath: string;
	obfuscatedFilePath: string;
}

export interface FunctionalTestingArtifactPaths {
	testPlanFilePath: string;
	unitReportFilePath?: string;
	regressionReportFilePath?: string;
	harnessFilePath?: string;
}

export class ExperimentLogger {
	private readonly runsDir: string;

	constructor(baseStoragePath: string) {
		this.runsDir = path.join(baseStoragePath, 'experiments', 'runs');
		ensureDirectoryExists(this.runsDir);
	}

	public saveCodeArtifacts(
		runId: string,
		sourceCode: string,
		obfuscatedCode: string
	): LoggedArtifactPaths {
		const runDir = path.join(this.runsDir, runId);
		ensureDirectoryExists(runDir);

		const sourceFilePath = path.join(runDir, 'source.c');
		const obfuscatedFilePath = path.join(runDir, 'obfuscated.c');
		const recordPath = path.join(runDir, 'record.json');

		writeTextFile(sourceFilePath, sourceCode);
		writeTextFile(obfuscatedFilePath, obfuscatedCode);

		return {
			runDir,
			recordPath,
			sourceFilePath,
			obfuscatedFilePath
		};
	}

	public saveFunctionalTestingArtifacts(
		runId: string,
		testPlan: AiFunctionalTestPlan,
		unitReport?: UnitTestReport,
		regressionReport?: RegressionTestReport
	): FunctionalTestingArtifactPaths {
		const runDir = path.join(this.runsDir, runId);
		ensureDirectoryExists(runDir);

		const testPlanFilePath = path.join(runDir, 'ai-test-plan.json');
		writeJsonFile(testPlanFilePath, testPlan);

		let unitReportFilePath: string | undefined;
		let regressionReportFilePath: string | undefined;
		let harnessFilePath: string | undefined;

		if (testPlan.unitTestHarnessCode) {
			harnessFilePath = path.join(runDir, 'unit-test-harness.c');
			writeTextFile(harnessFilePath, testPlan.unitTestHarnessCode);
		}

		if (unitReport) {
			unitReportFilePath = path.join(runDir, 'unit-test-report.json');
			writeJsonFile(unitReportFilePath, unitReport);
		}

		if (regressionReport) {
			regressionReportFilePath = path.join(runDir, 'regression-test-report.json');
			writeJsonFile(regressionReportFilePath, regressionReport);
		}

		return {
			testPlanFilePath,
			unitReportFilePath,
			regressionReportFilePath,
			harnessFilePath
		};
	}

	public saveRecord(record: ExperimentRecord, recordPath: string): void {
		writeJsonFile(recordPath, record);
	}
}