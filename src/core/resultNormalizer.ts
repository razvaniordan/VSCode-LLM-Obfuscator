import { NormalizedCodeResult } from './types';

export class ResultNormalizer {
	public normalize(rawText: string): NormalizedCodeResult {
		const warnings: string[] = [];
		let code = rawText.trim();

		// remove triple-backtick code fences if present
		const fencedMatch = code.match(/^```(?:c|C)?\s*([\s\S]*?)```$/);
		if (fencedMatch) {
			code = fencedMatch[1].trim();
			warnings.push('Removed Markdown code fences from provider response.');
		}

		return {
			code,
			warnings
		};
	}
}