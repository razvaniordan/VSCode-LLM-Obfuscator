import * as vscode from 'vscode';
import { ObfuscationOrchestrator } from '../core/orchestrator';
import { pickObfuscationCategory } from '../ui/quickPick';
import { getExtensionSettings } from '../ui/configuration';
import { pickProvider } from '../ui/providerPick';

async function openResultDocument(code: string): Promise<void> {
	const doc = await vscode.workspace.openTextDocument({
		language: 'c',
		content: code
	});

	await vscode.window.showTextDocument(doc, {
		preview: false
	});
}

export async function obfuscateSelectionCommand(): Promise<void> {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		void vscode.window.showErrorMessage('No active editor found.');
		return;
	}

	const selectedText = editor.document.getText(editor.selection);

	if (!selectedText || selectedText.trim().length === 0) {
		void vscode.window.showWarningMessage('Please select some C code first.');
		return;
	}

	const category = await pickObfuscationCategory();
	if (!category) {
		return;
	}

	const providerId = await pickProvider();
	if (!providerId) {
		return;
	}

	const settings = getExtensionSettings();
	const orchestrator = new ObfuscationOrchestrator();

	try {
		const result = await orchestrator.run({
			sourceCode: selectedText,
			category,
			providerId,
			modelId: settings.modelId
		});

		await openResultDocument(result.obfuscatedCode);

		void vscode.window.showInformationMessage(
			`Obfuscation completed with ${result.providerId}/${result.modelId} (${result.category}, prompt ${result.promptVersion}).`
		);

		console.log('Obfuscation notes:', result.notes);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		void vscode.window.showErrorMessage(`Obfuscation failed: ${message}`);
	}
}