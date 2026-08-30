import type { UserData } from '../types/user';

type TimestampLike = {
    toDate?: () => Date;
};

function asDate(value: unknown): Date | undefined {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return value;
    }
    if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as TimestampLike).toDate === 'function'
    ) {
        return (value as TimestampLike).toDate?.();
    }
    return undefined;
}

function asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

export function mapFirestoreUser(id: string, data: Record<string, unknown>): UserData {
    return {
        id,
        firstName: asString(data.firstName ?? data.first_name),
        middleName: asOptionalString(data.middleName ?? data.middle_name),
        lastName: asString(data.lastName ?? data.last_name),
        email: asString(data.email),
        phoneNumber: asString(data.phoneNumber ?? data.phone_number),
        address: asOptionalString(data.address),
        photo: asOptionalString(data.photo),
        dob: asOptionalString(data.dob),
        createdAt: asDate(data.createdAt),
        updatedAt: asDate(data.updatedAt),
    };
}

export function toFirestoreUserFields(userData: UserData): Record<string, string | null> {
    return {
        first_name: userData.firstName,
        middle_name: userData.middleName || null,
        last_name: userData.lastName,
        email: userData.email,
        phone_number: userData.phoneNumber,
        address: userData.address || null,
        photo: userData.photo || null,
        dob: userData.dob || null,
    };
}

export function toFirestoreUserUpdates(updates: Partial<UserData>): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.middleName !== undefined) updateData.middle_name = updates.middleName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.photo !== undefined) updateData.photo = updates.photo;
    if (updates.dob !== undefined) updateData.dob = updates.dob;

    Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return updateData;
}

export type FirebaseAuthLike = {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    photoURL?: string | null;
};

export function userFromFirebaseAuth(firebaseUser: FirebaseAuthLike): UserData {
    const nameParts = firebaseUser.displayName?.split(' ') || [];
    return {
        firstName: nameParts[0] || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
        lastName: nameParts.slice(1).join(' ') || '',
        email: firebaseUser.email || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        photo: firebaseUser.photoURL || undefined,
    };
}

export function mergeAuthAndStoredUser(base: UserData, stored: UserData): UserData {
    return {
        ...base,
        ...stored,
        email: stored.email || base.email,
        photo: stored.photo || base.photo,
    };
}
