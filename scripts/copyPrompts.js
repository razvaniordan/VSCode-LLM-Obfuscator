const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'src', 'prompts', 'templates');
const targetDir = path.join(__dirname, '..', 'dist', 'templates');

fs.mkdirSync(targetDir, { recursive: true });

for (const fileName of fs.readdirSync(sourceDir)) {
	const sourceFile = path.join(sourceDir, fileName);
	const targetFile = path.join(targetDir, fileName);
	fs.copyFileSync(sourceFile, targetFile);
}

console.log('Prompt templates copied successfully.');