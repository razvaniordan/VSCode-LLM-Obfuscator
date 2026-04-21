import * as vscode from 'vscode';

export type ProviderId = 'mock' | 'openai';

export async function pickProvider(): Promise<ProviderId | undefined> {
	const picked = await vscode.window.showQuickPick(
		[
			{
				label: 'mock',
				description: 'Local mock provider for testing architecture'
			},
			{
				label: 'openai',
				description: 'Use OpenAI API via .env key'
			}
		],
		{
			placeHolder: 'Choose provider'
		}
	);

	if (!picked) {
		return undefined;
	}

	if (picked.label === 'mock' || picked.label === 'openai') {
		return picked.label;
	}

	return undefined;
}