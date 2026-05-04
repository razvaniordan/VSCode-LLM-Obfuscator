import * as vscode from 'vscode';

export async function askRunFunctionalTesting(): Promise<boolean | undefined> {
	const picked = await vscode.window.showQuickPick(
		[
			{
				label: 'No',
				description: 'Only run compile check'
			},
			{
				label: 'Yes',
				description: 'Use AI to generate unit/regression tests and run them'
			}
		],
		{
			placeHolder: 'Run AI-generated functionality tests?'
		}
	);

	if (!picked) {
		return undefined;
	}

	return picked.label === 'Yes';
}

export async function askMaxRegressionTests(): Promise<number | undefined> {
	const value = await vscode.window.showInputBox({
		title: 'Maximum regression tests',
		prompt: 'How many black-box regression tests should AI generate at most?',
		value: '5',
		ignoreFocusOut: true,
		validateInput: (input) => {
			const parsed = Number(input);

			if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
				return 'Enter an integer between 1 and 10.';
			}

			return undefined;
		}
	});

	if (!value) {
		return undefined;
	}

	return Number(value);
}