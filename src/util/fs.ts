import * as fs from 'fs';
import * as path from 'path';

export function ensureDirectoryExists(dirPath: string): void {
	fs.mkdirSync(dirPath, { recursive: true });
}

export function writeTextFile(filePath: string, content: string): void {
	ensureDirectoryExists(path.dirname(filePath));
	fs.writeFileSync(filePath, content, 'utf8');
}

export function writeJsonFile(filePath: string, data: unknown): void {
	ensureDirectoryExists(path.dirname(filePath));
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}