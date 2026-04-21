export function makeTimestamp(): string {
	return new Date().toISOString();
}

export function makeRunId(): string {
	const now = new Date();
	const compact = now
		.toISOString()
		.replace(/[:.]/g, '-');

	const randomPart = Math.random().toString(36).slice(2, 8);
	return `run-${compact}-${randomPart}`;
}