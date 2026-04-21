import * as vscode from 'vscode';

export interface ExtensionSettings {
	modelId: string;
}

export function getExtensionSettings(): ExtensionSettings {
	const config = vscode.workspace.getConfiguration('llm-c-obfuscator');

	return {
		modelId: config.get<string>('model', 'gpt-5.4-mini')
	};
}