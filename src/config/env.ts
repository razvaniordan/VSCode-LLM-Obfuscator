import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

let isLoaded = false;

export function loadEnvironment(): void {
	if (isLoaded) {
		return;
	}

	const envPath = path.join(process.cwd(), '.env');

	if (fs.existsSync(envPath)) {
		dotenv.config({ path: envPath });
	} else {
		dotenv.config();
	}

	isLoaded = true;
}

export function getRequiredEnv(name: string): string {
	loadEnvironment();

	const value = process.env[name];

	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}