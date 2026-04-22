import * as vscode from 'vscode';
import { ObfuscationScope } from '../core/types';

export async function pickObfuscationScope(): Promise<ObfuscationScope | undefined> {
	const picked = await vscode.window.showQuickPick(
		[
			{
				label: 'file',
				description: 'Obfuscate the whole current C file'
			},
			{
				label: 'function',
				description: 'Obfuscate the selected full function only'
			}
		],
		{
			placeHolder: 'Choose obfuscation scope'
		}
	);

	if (!picked) {
		return undefined;
	}

	if (picked.label === 'file' || picked.label === 'function') {
		return picked.label;
	}

	return undefined;
}