export type QrPayload = {
    uid: string;
    email: string;
    name: string;
    timestamp: string;
};

export function buildQrPayload(
    userId: string,
    userEmail: string,
    additionalData?: { name?: string },
    now: Date = new Date(),
): QrPayload {
    return {
        uid: userId,
        email: userEmail,
        name: additionalData?.name || '',
        timestamp: now.toISOString(),
    };
}

export function encodeQrPayload(
    userId: string,
    userEmail: string,
    additionalData?: { name?: string },
    now: Date = new Date(),
): string {
    return JSON.stringify(buildQrPayload(userId, userEmail, additionalData, now));
}

export function parseQrUserId(qrData: string): string | null {
    const trimmed = qrData.trim();
    if (!trimmed) {
        return null;
    }

    try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        const userId = parsed.uid || parsed.userId || parsed.id || null;
        return typeof userId === 'string' && userId.trim() ? userId : null;
    } catch {
        return trimmed;
    }
}
