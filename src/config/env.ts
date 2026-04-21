import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

let isLoaded = false;

export function loadEnvironment(extensionRootPath: string): void {
	if (isLoaded) {
		return;
	}

	const envPath = path.join(extensionRootPath, '.env');

	console.log('Trying to load .env from:', envPath);

	if (fs.existsSync(envPath)) {
		dotenv.config({ path: envPath });
		console.log(`Loaded .env from: ${envPath}`);
	} else {
		console.warn(`.env file not found at: ${envPath}`);
	}

	isLoaded = true;
}

export function getRequiredEnv(name: string): string {
	const value = process.env[name];

	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}