import { describe, expect, it } from 'vitest';
import { isAdminEmail } from './adminConfig';

describe('isAdminEmail', () => {
    it('accepts the configured admin address, ignoring case and surrounding space', () => {
        expect(isAdminEmail('admin@perlasngsilangan.com')).toBe(true);
        expect(isAdminEmail('  Admin@PerlasNgSilangan.com  ')).toBe(true);
    });

    it('rejects missing or non-admin emails', () => {
        expect(isAdminEmail(null)).toBe(false);
        expect(isAdminEmail(undefined)).toBe(false);
        expect(isAdminEmail('')).toBe(false);
        expect(isAdminEmail('member@example.com')).toBe(false);
    });
});
