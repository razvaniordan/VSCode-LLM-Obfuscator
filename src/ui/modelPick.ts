import * as vscode from 'vscode';
import { ProviderId } from './providerPick';

export async function pickModel(providerId: ProviderId): Promise<string | undefined> {
	let items: Array<{ label: string; description: string }> = [];

	switch (providerId) {
		case 'mock':
			items = [
				{
					label: 'mock-v1',
					description: 'Built-in mock provider model'
				}
			];
			break;

		case 'openai':
			items = [
				{
					label: 'gpt-5.4-mini',
					description: 'Lower cost OpenAI option'
				},
				{
					label: 'gpt-5.4',
					description: 'Stronger OpenAI option'
				}
			];
			break;

		case 'claude':
			items = [
				{
					label: 'claude-sonnet-4-6',
					description: 'Balanced Claude model'
				},
				{
					label: 'claude-opus-4-7',
					description: 'Stronger Claude model'
				}
			];
			break;

		case 'gemini':
			items = [
				{
					label: 'gemini-2.5-flash',
					description: 'Lower cost Gemini option'
				},
				{
					label: 'gemini-2.5-pro',
					description: 'Stronger Gemini option'
				}
			];
			break;

		default:
			return undefined;
	}

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: `Choose model for provider: ${providerId}`
	});

	return picked?.label;
}