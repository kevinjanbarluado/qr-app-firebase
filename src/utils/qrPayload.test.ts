import { describe, expect, it } from 'vitest';
import { buildQrPayload, encodeQrPayload, parseQrUserId } from './qrPayload';

describe('buildQrPayload', () => {
    it('encodes uid, email, optional name, and a timestamp', () => {
        const now = new Date('2026-08-30T10:00:00.000Z');
        expect(buildQrPayload('uid-1', 'ada@example.com', { name: 'Ada' }, now)).toEqual({
            uid: 'uid-1',
            email: 'ada@example.com',
            name: 'Ada',
            timestamp: '2026-08-30T10:00:00.000Z',
        });
    });

    it('defaults name to an empty string', () => {
        const payload = buildQrPayload('uid-1', 'ada@example.com', undefined, new Date('2026-01-01T00:00:00.000Z'));
        expect(payload.name).toBe('');
    });
});

describe('encodeQrPayload', () => {
    it('serializes the payload as JSON', () => {
        const now = new Date('2026-08-30T10:00:00.000Z');
        expect(JSON.parse(encodeQrPayload('uid-1', 'ada@example.com', { name: 'Ada' }, now))).toEqual({
            uid: 'uid-1',
            email: 'ada@example.com',
            name: 'Ada',
            timestamp: '2026-08-30T10:00:00.000Z',
        });
    });
});

describe('parseQrUserId', () => {
    it('reads uid, userId, or id from JSON payloads', () => {
        expect(parseQrUserId(JSON.stringify({ uid: 'abc' }))).toBe('abc');
        expect(parseQrUserId(JSON.stringify({ userId: 'def' }))).toBe('def');
        expect(parseQrUserId(JSON.stringify({ id: 'ghi' }))).toBe('ghi');
    });

    it('treats a raw string as the user id', () => {
        expect(parseQrUserId('  plain-uid  ')).toBe('plain-uid');
    });

    it('returns null for empty or JSON payloads without an id', () => {
        expect(parseQrUserId('')).toBeNull();
        expect(parseQrUserId('   ')).toBeNull();
        expect(parseQrUserId(JSON.stringify({ email: 'ada@example.com' }))).toBeNull();
        expect(parseQrUserId(JSON.stringify({ uid: '' }))).toBeNull();
    });
});
