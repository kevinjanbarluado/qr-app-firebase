import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDoc, setDoc, updateDoc, doc, Timestamp, timestampNow } = vi.hoisted(() => {
    const timestampNow = { seconds: 1 };
    return {
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        doc: vi.fn(() => ({ id: 'uid-1' })),
        timestampNow,
        Timestamp: {
            now: vi.fn(() => timestampNow),
            fromDate: vi.fn((date: Date) => ({ fromDate: date })),
        },
    };
});

vi.mock('firebase/firestore', () => ({
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp,
}));

vi.mock('../config/firebase', () => ({
    db: { name: 'mock-db' },
}));

import { getUserFromFirestore, saveUserToFirestore, updateUserInFirestore } from './userService';

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        doc.mockReturnValue({ id: 'uid-1' });
    });

    it('maps a Firestore document through mapFirestoreUser', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: 'uid-1',
            data: () => ({
                first_name: 'Ada',
                last_name: 'Byron',
                email: 'ada@example.com',
                phone_number: '555-0100',
            }),
        });

        await expect(getUserFromFirestore('uid-1')).resolves.toMatchObject({
            id: 'uid-1',
            firstName: 'Ada',
            lastName: 'Byron',
            email: 'ada@example.com',
            phoneNumber: '555-0100',
        });
    });

    it('returns null when the user document does not exist', async () => {
        getDoc.mockResolvedValue({ exists: () => false });
        await expect(getUserFromFirestore('missing')).resolves.toBeNull();
    });

    it('saves snake_case profile fields plus timestamps', async () => {
        await saveUserToFirestore('uid-1', {
            firstName: 'Ada',
            lastName: 'Byron',
            email: 'ada@example.com',
            phoneNumber: '555-0100',
        });

        expect(setDoc).toHaveBeenCalledWith(
            { id: 'uid-1' },
            expect.objectContaining({
                first_name: 'Ada',
                last_name: 'Byron',
                email: 'ada@example.com',
                phone_number: '555-0100',
                middle_name: null,
                updatedAt: timestampNow,
            }),
        );
    });

    it('updates only the provided fields', async () => {
        await updateUserInFirestore('uid-1', { firstName: 'Grace' });
        expect(updateDoc).toHaveBeenCalledWith(
            { id: 'uid-1' },
            expect.objectContaining({
                first_name: 'Grace',
                updatedAt: timestampNow,
            }),
        );
    });
});
