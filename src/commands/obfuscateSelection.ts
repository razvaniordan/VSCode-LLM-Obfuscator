import * as vscode from 'vscode';
import { ObfuscationOrchestrator } from '../core/orchestrator';
import { pickObfuscationCategory } from '../ui/quickPick';
import { pickProvider } from '../ui/providerPick';
import { pickModel } from '../ui/modelPick';
import { pickObfuscationScope } from '../ui/scopePick';
import { validateFunctionSelection } from '../validation/functionSelection';

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

	if (editor.document.languageId !== 'c') {
		void vscode.window.showWarningMessage('Please open a C source file first.');
		return;
	}

	const scope = await pickObfuscationScope();
	if (!scope) {
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

	const modelId = await pickModel(providerId);
	if (!modelId) {
		return;
	}

	const fullDocumentCode = editor.document.getText();
	let sourceCode = fullDocumentCode;
	let selectionStartOffset: number | undefined;
	let selectionEndOffset: number | undefined;
	let selectionStartLine: number | undefined;
	let selectionEndLine: number | undefined;

	if (scope === 'function') {
		const validation = validateFunctionSelection(editor);

		if (!validation.valid) {
			void vscode.window.showWarningMessage(
				validation.message ?? 'Invalid function selection.'
			);
			return;
		}

		sourceCode = validation.selectedCode!;
		selectionStartOffset = validation.startOffset;
		selectionEndOffset = validation.endOffset;
		selectionStartLine = validation.startLine;
		selectionEndLine = validation.endLine;
	}

	const orchestrator = new ObfuscationOrchestrator();

	try {
		const result = await orchestrator.run({
			sourceCode,
			fullDocumentCode,
			category,
			scope,
			providerId,
			modelId,
			selectionStartOffset,
			selectionEndOffset,
			selectionStartLine,
			selectionEndLine
		});

		await openResultDocument(result.reconstructedFullCode);

		void vscode.window.showInformationMessage(
			`Obfuscation completed with ${result.providerId}/${result.modelId} (${result.category}, ${result.scope}).`
		);

		console.log('Obfuscation notes:', result.notes);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		void vscode.window.showErrorMessage(`Obfuscation failed: ${message}`);
	}
}