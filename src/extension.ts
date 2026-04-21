import * as vscode from 'vscode';
import { obfuscateSelectionCommand } from './commands/obfuscateSelection';
import { loadEnvironment } from './config/env';

export function activate(context: vscode.ExtensionContext): void {
	loadEnvironment();

	const disposable = vscode.commands.registerCommand(
		'llm-c-obfuscator.obfuscateSelection',
		obfuscateSelectionCommand
	);

	context.subscriptions.push(disposable);
}

export function deactivate(): void {
	// Nothing to clean up yet.
}