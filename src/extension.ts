import * as vscode from 'vscode';
import { obfuscateSelectionCommand } from './commands/obfuscateSelection';
import { loadEnvironment } from './config/env';
import { initializeAppPaths } from './services/appPaths';

export function activate(context: vscode.ExtensionContext): void {
	loadEnvironment(context.extensionPath);

	initializeAppPaths(context.extensionPath);

	console.log('Extension path:', context.extensionPath);

	const disposable = vscode.commands.registerCommand(
		'llm-c-obfuscator.obfuscateSelection',
		obfuscateSelectionCommand
	);

	context.subscriptions.push(disposable);
}

export function deactivate(): void {
	// Nothing to clean up yet.
}