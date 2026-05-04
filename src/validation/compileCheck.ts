import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawnSync } from 'child_process';
import { CompileCheckResult } from '../core/types';

export class CompileCheck {
	public compileSourceCode(sourceCode: string, fileNameBase: string): CompileCheckResult {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-c-obfuscator-'));

		const sourceFilePath = path.join(tempDir, `${fileNameBase}.c`);
		const outputBinaryPath = path.join(tempDir, process.platform === 'win32' ? `${fileNameBase}.exe` : fileNameBase);

		fs.writeFileSync(sourceFilePath, sourceCode, 'utf8');

		return this.compileFile(sourceFilePath, outputBinaryPath);
	}

	public compileFile(sourceFilePath: string, outputBinaryPath: string): CompileCheckResult {
		const compiler = 'gcc';
		const args = [sourceFilePath, '-o', outputBinaryPath];

		try {
			const result = spawnSync(compiler, args, {encoding: 'utf8'});

			if (result.error) {
				return {
					attempted: true,
					succeeded: false,
					compiler,
					commandLine: this.formatCommandLine(compiler, args),
					stdout: result.stdout ?? '',
					stderr: result.stderr ?? '',
					errorMessage: result.error.message
				};
			}

			return {
				attempted: true,
				succeeded: result.status === 0,
				compiler,
				commandLine: this.formatCommandLine(compiler, args),
				stdout: result.stdout ?? '',
				stderr: result.stderr ?? '',
				outputBinaryPath: result.status === 0 ? outputBinaryPath : undefined
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown compile error';

			return {
				attempted: true,
				succeeded: false,
				compiler,
				commandLine: this.formatCommandLine(compiler, args),
				stdout: '',
				stderr: '',
				errorMessage: message
			};
		}
	}

	public notAttempted(): CompileCheckResult {
		return {
			attempted: false,
			succeeded: false,
			compiler: 'gcc',
			commandLine: '',
			stdout: '',
			stderr: ''
		};
	}

	private formatCommandLine(compiler: string, args: string[]): string {
		return [compiler, ...args.map((arg) => `"${arg}"`)].join(' ');
	}
}