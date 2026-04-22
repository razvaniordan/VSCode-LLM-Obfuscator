import * as vscode from 'vscode';

export interface FunctionSelectionValidationResult {
	valid: boolean;
	message?: string;
	selectedCode?: string;
	startOffset?: number;
	endOffset?: number;
	startLine?: number;
	endLine?: number;
}

export function validateFunctionSelection(
	editor: vscode.TextEditor
): FunctionSelectionValidationResult {
	const selection = editor.selection;

	if (selection.isEmpty) {
		return {
			valid: false,
			message: 'Please select a full function first.'
		};
	}

	const rawSelectedText = editor.document.getText(selection);
	const selectedText = rawSelectedText.trim();

	if (!selectedText) {
		return {
			valid: false,
			message: 'The selected function is empty.'
		};
	}

	if (!selectedText.includes('{') || !selectedText.includes('}')) {
		return {
			valid: false,
			message: 'The selection does not look like a full function.'
		};
	}

	const braceBalance = computeBraceBalance(selectedText);
	if (braceBalance !== 0) {
		return {
			valid: false,
			message: 'The selected text has unbalanced braces.'
		};
	}

	// reject obvious control flow blocks that are not functions
	const startsWithControlKeyword = /^(for|if|while|switch|do)\b/.test(selectedText);
	if (startsWithControlKeyword) {
		return {
			valid: false,
			message: 'The selection starts with a control-flow statement, not a function.'
		};
	}

	// require something that looks like a C function definition:
	// [qualifiers/return type] functionName(args) {
	const functionHeaderRegex =
		/^(?:[A-Za-z_][A-Za-z0-9_\s\*\[\]]*?\s+)?[A-Za-z_][A-Za-z0-9_]*\s*\([^;{}]*\)\s*\{/s;

	if (!functionHeaderRegex.test(selectedText)) {
		return {
			valid: false,
			message: 'The selection does not appear to start with a valid C function definition.'
		};
	}

	// ensure the outermost opening brace belongs to the function body
	const firstBraceIndex = selectedText.indexOf('{');
	if (firstBraceIndex === -1) {
		return {
			valid: false,
			message: 'No function body found.'
		};
	}

	const matchingBraceIndex = findMatchingClosingBrace(selectedText, firstBraceIndex);
	if (matchingBraceIndex === -1) {
		return {
			valid: false,
			message: 'Could not match the function body braces.'
		};
	}

	// only whitespace should remain after the outer function closes (of the selected code -> which should be only a full function)
	const trailingText = selectedText.slice(matchingBraceIndex + 1).trim();
	if (trailingText.length > 0) {
		return {
			valid: false,
			message: 'The selection appears to contain extra code beyond a single function.'
		};
	}

	return {
		valid: true,
		selectedCode: rawSelectedText,
		startOffset: editor.document.offsetAt(selection.start),
		endOffset: editor.document.offsetAt(selection.end),
		startLine: selection.start.line + 1,
		endLine: selection.end.line + 1
	};
}

function computeBraceBalance(text: string): number {
	let balance = 0;

	for (const char of text) {
		if (char === '{') {
			balance++;
		} else if (char === '}') {
			balance--;
		}
	}

	return balance;
}

function findMatchingClosingBrace(text: string, openBraceIndex: number): number {
	let depth = 0;

	for (let i = openBraceIndex; i < text.length; i++) {
		const char = text[i];

		if (char === '{') {
			depth++;
		} else if (char === '}') {
			depth--;
			if (depth === 0) {
				return i;
			}
		}
	}

	return -1;
}