// @ts-nocheck
// QR Code Generator Service - Generates QR codes directly in the frontend
import QRCode from 'qrcode';

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => {
            reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
};

// Verify QRCode library is loaded (don't crash the whole app; surface errors where used)
if (!QRCode) {
    // eslint-disable-next-line no-console
    console.error('❌ QRCode library not loaded!');
}

const cacheKey = (userId: string) => `qrapp:qrCode:${userId}`;
const writeCachedQR = (userId: string, qrCode: string) => {
    try {
        localStorage.setItem(cacheKey(userId), JSON.stringify({ qrCode, updatedAt: Date.now() }));
    } catch {
        // ignore
    }
};

/**
 * Generate QR code as data URL (base64 image)
 */
export const generateQRCodeDataURL = async (data: string): Promise<string> => {
    try {
        console.log('🎨 Generating QR code for data:', data);
        const qrCodeDataURL = await withTimeout(
            QRCode.toDataURL(data, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            }),
            8000,
            'QR code generation'
        );
        console.log('✅ QR code generated successfully');
        return qrCodeDataURL;
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        throw error;
    }
};

/**
 * Generate QR code as SVG string
 */
export const generateQRCodeSVG = async (data: string): Promise<string> => {
    try {
        console.log('🎨 Generating QR code SVG for data:', data);
        const qrCodeSVG = await QRCode.toString(data, {
            type: 'svg',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        console.log('✅ QR code SVG generated successfully');
        return qrCodeSVG;
    } catch (error) {
        console.error('❌ Error generating QR code SVG:', error);
        throw error;
    }
};

/**
 * Generate QR code and save to Firestore
 */
export const generateAndSaveQRCode = async (
    userId: string,
    userEmail: string,
    qrData: string
): Promise<string> => {
    try {
        console.log('🔄 Generating and saving QR code for UID:', userId);

        // Generate QR code first
        const qrCodeDataURL = await generateQRCodeDataURL(qrData);
        // Cache immediately so reloads are instant even if Firestore is slow
        writeCachedQR(userId, qrCodeDataURL);
        console.log('✅ QR code generated and cached locally (no Firestore write)');

        return qrCodeDataURL;
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
        throw error;
    }
};

/**
 * Generate QR code for Firebase UID
 * The QR code will contain the UID, which can be scanned to identify the user
 */
export const generateQRCodeForUser = async (
    userId: string,
    userEmail: string,
    additionalData?: { name?: string; email?: string }
): Promise<string> => {
    try {
        console.log('👤 Generating QR code for user:', {
            userId,
            userEmail,
            additionalData,
        });

        // Create QR code data - you can customize what data to encode
        // Option 1: Just the UID
        // const qrData = userId;

        // Option 2: JSON with user info
        const qrData = JSON.stringify({
            uid: userId,
            email: userEmail,
            name: additionalData?.name || '',
            timestamp: new Date().toISOString(),
        });

        console.log('📝 QR code data to encode:', qrData);

        // Generate and save QR code
        const qrCode = await generateAndSaveQRCode(userId, userEmail, qrData);

        return qrCode;
    } catch (error) {
        console.error('❌ Error generating QR code for user:', error);
        throw error;
    }
};

