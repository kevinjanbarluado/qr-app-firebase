import { describe, expect, it } from 'vitest';
import type { UserData } from '../types/user';
import {
    mapFirestoreUser,
    mergeAuthAndStoredUser,
    toFirestoreUserFields,
    toFirestoreUserUpdates,
    userFromFirebaseAuth,
} from './userMapper';

const sampleUser: UserData = {
    id: 'uid-1',
    firstName: 'Ada',
    middleName: 'Lovelace',
    lastName: 'Byron',
    email: 'ada@example.com',
    phoneNumber: '555-0100',
    address: 'London',
    photo: 'https://example.com/ada.png',
    dob: '1815-12-10',
};

describe('mapFirestoreUser', () => {
    it('maps snake_case Firestore fields and Timestamp-like dates', () => {
        const created = new Date('2026-01-01T00:00:00.000Z');
        const updated = new Date('2026-02-01T00:00:00.000Z');

        expect(
            mapFirestoreUser('uid-1', {
                first_name: 'Ada',
                middle_name: 'Lovelace',
                last_name: 'Byron',
                email: 'ada@example.com',
                phone_number: '555-0100',
                address: 'London',
                photo: 'https://example.com/ada.png',
                dob: '1815-12-10',
                createdAt: { toDate: () => created },
                updatedAt: { toDate: () => updated },
            }),
        ).toEqual({
            ...sampleUser,
            createdAt: created,
            updatedAt: updated,
        });
    });

    it('prefers camelCase fields when both shapes are present', () => {
        expect(
            mapFirestoreUser('uid-1', {
                firstName: 'Ada',
                first_name: 'Ignored',
                lastName: 'Byron',
                last_name: 'Ignored',
                email: 'ada@example.com',
                phoneNumber: '555-0100',
                phone_number: 'ignored',
            }),
        ).toMatchObject({
            id: 'uid-1',
            firstName: 'Ada',
            lastName: 'Byron',
            phoneNumber: '555-0100',
        });
    });
});

describe('toFirestoreUserFields', () => {
    it('writes profile fields as snake_case and nulls empty optionals', () => {
        expect(
            toFirestoreUserFields({
                firstName: 'Ada',
                lastName: 'Byron',
                email: 'ada@example.com',
                phoneNumber: '555-0100',
            }),
        ).toEqual({
            first_name: 'Ada',
            middle_name: null,
            last_name: 'Byron',
            email: 'ada@example.com',
            phone_number: '555-0100',
            address: null,
            photo: null,
            dob: null,
        });
    });
});

describe('toFirestoreUserUpdates', () => {
    it('maps only provided camelCase fields', () => {
        expect(toFirestoreUserUpdates({ firstName: 'Grace', phoneNumber: '555-0199' })).toEqual({
            first_name: 'Grace',
            phone_number: '555-0199',
        });
    });
});

describe('userFromFirebaseAuth', () => {
    it('splits a display name and falls back to the email local part', () => {
        expect(
            userFromFirebaseAuth({
                displayName: 'Ada Lovelace',
                email: 'ada@example.com',
                phoneNumber: '555-0100',
                photoURL: 'https://example.com/ada.png',
            }),
        ).toEqual({
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.com',
            phoneNumber: '555-0100',
            photo: 'https://example.com/ada.png',
        });

        expect(userFromFirebaseAuth({ email: 'grace@example.com' })).toMatchObject({
            firstName: 'grace',
            lastName: '',
            email: 'grace@example.com',
        });
    });
});

describe('mergeAuthAndStoredUser', () => {
    it('lets stored profile fields win, keeping auth email and photo as fallbacks', () => {
        const base: UserData = {
            firstName: 'Auth',
            lastName: 'User',
            email: 'auth@example.com',
            phoneNumber: '',
            photo: 'https://example.com/auth.png',
        };
        const stored: UserData = {
            ...sampleUser,
            email: '',
            photo: undefined,
        };

        expect(mergeAuthAndStoredUser(base, stored)).toMatchObject({
            firstName: 'Ada',
            lastName: 'Byron',
            email: 'auth@example.com',
            photo: 'https://example.com/auth.png',
        });
    });
});
