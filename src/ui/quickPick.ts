import * as vscode from 'vscode';
import { ObfuscationCategory } from '../core/types';

export async function pickObfuscationCategory():
	Promise<ObfuscationCategory | undefined> {
	const picked = await vscode.window.showQuickPick(
		[
			{ label: 'layout', description: 'Layout obfuscation' },
			{ label: 'control', description: 'Code control obfuscation' },
			{ label: 'data', description: 'Data obfuscation' }
		],
		{
			placeHolder: 'Choose obfuscation category'
		}
	);

	if (!picked) {
		return undefined;
	}

	if (picked.label === 'layout' || picked.label === 'control' || picked.label === 'data') {
		return picked.label;
	}

	return undefined;
}