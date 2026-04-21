import * as path from 'path';
import { ExperimentRecord } from '../core/types';
import { ensureDirectoryExists, writeJsonFile, writeTextFile } from '../util/fs';

export interface LoggedArtifactPaths {
	runDir: string;
	recordPath: string;
	sourceFilePath: string;
	obfuscatedFilePath: string;
}

export class ExperimentLogger {
	private readonly runsDir: string;

	constructor(baseStoragePath: string) {
		this.runsDir = path.join(baseStoragePath, 'experiments', 'runs');
		ensureDirectoryExists(this.runsDir);
	}

	public saveCodeArtifacts(runId: string, sourceCode: string, obfuscatedCode: string): LoggedArtifactPaths {
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

	public saveRecord(record: ExperimentRecord, recordPath: string): void {
		writeJsonFile(recordPath, record);
	}
}