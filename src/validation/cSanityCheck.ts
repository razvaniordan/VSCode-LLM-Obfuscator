import { SanityCheckResult } from '../core/types';

export class CSanityCheck {
	public run(code: string): SanityCheckResult {
		const warnings: string[] = [];

		if (!code || code.trim().length === 0) {
			return {
				passed: false,
				warnings: ['Generated code is empty.']
			};
		}

		if (!/[;{}]/.test(code)) {
			warnings.push('Generated output does not look like typical C code.');
		}

		if (/```/.test(code)) {
			warnings.push('Generated output still contains Markdown fences.');
		}

		if (/^\s*(Here is|Explanation:|This code)/mi.test(code)) {
			warnings.push('Generated output may contain explanatory text instead of pure C code.');
		}

		const braceBalance = this.computeBraceBalance(code);
		if (braceBalance !== 0) {
			warnings.push(`Brace balance is not zero (balance=${braceBalance}).`);
		}

		return {
			passed: warnings.length === 0,
			warnings
		};
	}

	private computeBraceBalance(code: string): number {
		let balance = 0;

		for (const char of code) {
			if (char === '{') {
				balance++;
			} else if (char === '}') {
				balance--;
			}
		}

		return balance;
	}
}