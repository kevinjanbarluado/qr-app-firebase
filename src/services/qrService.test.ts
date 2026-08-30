import { beforeEach, describe, expect, it } from 'vitest';
import { getUserQRCode, saveQRCode } from './qrService';

describe('qrService localStorage cache', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when no cached QR exists', async () => {
        await expect(getUserQRCode('uid-1', 'ada@example.com')).resolves.toBeNull();
    });

    it('saves a QR image and reads it back for the same user', async () => {
        await saveQRCode('uid-1', 'ada@example.com', 'data:image/png;base64,abc');
        await expect(getUserQRCode('uid-1', 'ada@example.com')).resolves.toBe(
            'data:image/png;base64,abc',
        );
        await expect(getUserQRCode('uid-2', 'ada@example.com')).resolves.toBeNull();
    });

    it('ignores corrupt cache entries', async () => {
        localStorage.setItem('qrapp:qrCode:uid-1', 'not-json');
        await expect(getUserQRCode('uid-1', 'ada@example.com')).resolves.toBeNull();

        localStorage.setItem('qrapp:qrCode:uid-1', JSON.stringify({ qrCode: 123 }));
        await expect(getUserQRCode('uid-1', 'ada@example.com')).resolves.toBeNull();
    });
});
