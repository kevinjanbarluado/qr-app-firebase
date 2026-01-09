// QR Code Service - Generates QR in frontend; stores/retrieves only from localStorage cache

const cacheKey = (userId: string) => `qrapp:qrCode:${userId}`;

type CachedQR = { qrCode: string; updatedAt: number };

const readCachedQR = (userId: string): CachedQR | null => {
    try {
        const raw = localStorage.getItem(cacheKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<CachedQR>;
        if (typeof parsed.qrCode === 'string' && typeof parsed.updatedAt === 'number') {
            return { qrCode: parsed.qrCode, updatedAt: parsed.updatedAt };
        }
        return null;
    } catch {
        return null;
    }
};

const writeCachedQR = (userId: string, qrCode: string) => {
    try {
        const payload: CachedQR = { qrCode, updatedAt: Date.now() };
        localStorage.setItem(cacheKey(userId), JSON.stringify(payload));
    } catch {
        // ignore quota / private mode errors
    }
};

/**
 * Get or create QR code for a user
 * If QR code doesn't exist in Firestore, fetch it from API and store it
 */
export const getUserQRCode = async (userId: string, _userEmail: string): Promise<string | null> => {
    try {
        console.log('🔍 getUserQRCode called with UID:', userId);

        // 1) FAST PATH: localStorage cache
        const cached = readCachedQR(userId);
        if (cached?.qrCode) {
            console.log('⚡ QR code loaded from localStorage cache');
            return cached.qrCode;
        }

        console.log('⚠️ QR code not found (will be generated locally)');
        return null;
    } catch (error) {
        console.warn('⚠️ QR code lookup failed; will generate locally:', error);
        return null;
    }
};

/**
 * Store QR code in Firestore
 */
export const saveQRCode = async (userId: string, userEmail: string, qrCode: string): Promise<void> => {
    try {
        // Save locally immediately for fast next load
        writeCachedQR(userId, qrCode);
        // No Firestore write needed for QR codes.
        void userEmail;
    } catch (error) {
        console.error('Error saving QR code:', error);
        throw error;
    }
};
