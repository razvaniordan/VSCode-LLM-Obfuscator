import { AiFunctionalTestPlan, FunctionalTestStrategy, RegressionTestCase } from '../core/types';

export class AiFunctionalTestPlanParser {
	public parse(rawText: string): AiFunctionalTestPlan {
		const jsonText = this.extractJson(rawText);
		const parsed = JSON.parse(jsonText) as unknown;

		if (!this.isObject(parsed)) {
			throw new Error('AI test plan is not a JSON object.');
		}

		const strategy = this.parseStrategy(parsed['strategy']);
		const reason = typeof parsed['reason'] === 'string' ? parsed['reason'] : 'No reason provided.';

		const unitTestHarnessCode = typeof parsed['unitTestHarnessCode'] === 'string' && parsed['unitTestHarnessCode'].trim().length > 0 ? parsed['unitTestHarnessCode'] : undefined;

		const regressionTests = this.parseRegressionTests(parsed['regressionTests']);

		return {
			strategy,
			reason,
			unitTestHarnessCode,
			regressionTests
		};
	}

	private extractJson(rawText: string): string {
		let text = rawText.trim();

		const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
		if (fenced) {
			text = fenced[1].trim();
		}

		const firstBrace = text.indexOf('{');
		const lastBrace = text.lastIndexOf('}');

		if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
			throw new Error('Could not find JSON object in AI test plan response.');
		}

		return text.slice(firstBrace, lastBrace + 1);
	}

	private parseStrategy(value: unknown): FunctionalTestStrategy {
		if (value === 'none' || value === 'unit' || value === 'regression' || value === 'both') {
			return value;
		}
		return 'none';
	}

	private parseRegressionTests(value: unknown): RegressionTestCase[] {
		if (!Array.isArray(value)) {
			return [];
		}

		const tests = value
			.map((item, index) => this.parseRegressionTest(item, index))
			.filter((item): item is RegressionTestCase => item !== undefined);

		return tests.slice(0, 10);
	}

	private parseRegressionTest(value: unknown, index: number): RegressionTestCase | undefined {
		if (!this.isObject(value)) {
			return undefined;
		}

		const name = typeof value['name'] === 'string' && value['name'].trim().length > 0 ? value['name'].trim() : `regression-test-${index + 1}`;

		const argsRaw = value['args'];
		const args = Array.isArray(argsRaw) ? argsRaw.filter((arg): arg is string => typeof arg === 'string') : [];

		const stdin = typeof value['stdin'] === 'string' ? value['stdin'] : '';

		const timeoutMs = 10000;

		return {
			name,
			args,
			stdin,
			timeoutMs
		};
	}

	private isObject(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}
}