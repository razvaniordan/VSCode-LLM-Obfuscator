import * as fs from 'fs';
import * as path from 'path';
import { ObfuscationCategory } from '../core/types';

export interface PromptTemplate {
	category: ObfuscationCategory;
	version: string;
	text: string;
}

export class PromptManager {
	public load(category: ObfuscationCategory): PromptTemplate {
		const version = 'v1';
		const fileName = `${category}.${version}.txt`;

		const templatePath = path.join(__dirname, 'templates', fileName);
		const text = fs.readFileSync(templatePath, 'utf8');

		return {
			category,
			version,
			text
		};
	}
}