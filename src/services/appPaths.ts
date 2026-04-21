let globalStoragePath: string | undefined;

export function initializeAppPaths(storagePath: string): void {
	globalStoragePath = storagePath;
}

export function getGlobalStoragePath(): string {
	if (!globalStoragePath) {
		throw new Error('Global storage path is not initialized.');
	}

	return globalStoragePath;
}