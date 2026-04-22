import * as vscode from 'vscode';

export type ProviderId = 'mock' | 'openai' | 'claude' | 'gemini';

export async function pickProvider(): Promise<ProviderId | undefined> {
	const picked = await vscode.window.showQuickPick(
		[
			{
				label: 'mock',
				description: 'Local mock provider for testing architecture without API calls'
			},
			{
				label: 'openai',
				description: 'Use OpenAI API'
			},
			{
				label: 'claude',
				description: 'Use Anthropic Claude API'
			},
			{
				label: 'gemini',
				description: 'Use Google Gemini API'
			}
		],
		{
			placeHolder: 'Choose provider'
		}
	);

	if (!picked) {
		return undefined;
	}

	if (
		picked.label === 'mock' ||
		picked.label === 'openai' ||
		picked.label === 'claude' ||
		picked.label === 'gemini'
	) {
		return picked.label;
	}

	return undefined;
}