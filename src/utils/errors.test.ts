import { describe, expect, it } from 'vitest';
import { getErrorCode, getErrorMessage } from './errors';

describe('getErrorMessage', () => {
    it('reads Error.message and falls back otherwise', () => {
        expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
        expect(getErrorMessage({ message: 'nope' }, 'fallback')).toBe('nope');
        expect(getErrorMessage('boom', 'fallback')).toBe('fallback');
        expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    });
});

describe('getErrorCode', () => {
    it('reads a string code from error-like objects', () => {
        expect(getErrorCode({ code: 'auth/popup-blocked' })).toBe('auth/popup-blocked');
        expect(getErrorCode(new Error('boom'))).toBeUndefined();
        expect(getErrorCode(null)).toBeUndefined();
    });
});
