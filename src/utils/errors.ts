export function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) {
        return err.message;
    }
    if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof err.message === 'string' &&
        err.message
    ) {
        return err.message;
    }
    return fallback;
}

export function getErrorCode(err: unknown): string | undefined {
    if (typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string') {
        return err.code;
    }
    return undefined;
}
