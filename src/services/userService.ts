// @ts-nocheck
// User Service - Handles user data storage and retrieval from Firestore and API
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { API_ENDPOINTS } from '../config/api';
import type { UserData } from '../types/user';
import { USERS_COLLECTION } from '../config/firestoreCollections';

// Re-export UserData for convenience
export type { UserData };

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
};

/**
 * Fetch user data from Firestore
 */
export const getUserFromFirestore = async (userId: string): Promise<UserData | null> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Support both camelCase and snake_case Firestore fields
            const firstName = (data.firstName ?? data.first_name ?? '') as string;
            const middleName = (data.middleName ?? data.middle_name ?? undefined) as (string | undefined);
            const lastName = (data.lastName ?? data.last_name ?? '') as string;
            const phoneNumber = (data.phoneNumber ?? data.phone_number ?? '') as string;
            const address = (data.address ?? undefined) as (string | undefined);
            const dob = (data.dob ?? undefined) as (string | undefined);
            const email = (data.email ?? '') as string;
            const photo = (data.photo ?? undefined) as (string | undefined);
            return {
                id: userDocSnap.id,
                firstName,
                middleName,
                lastName,
                email,
                phoneNumber,
                address,
                photo,
                dob,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            } as UserData;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user from Firestore:', error);
        throw error;
    }
};

/**
 * Fetch user data from API
 */
export const getUserFromAPI = async (userId: string): Promise<UserData | null> => {
    try {
        const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`);
        if (response.ok) {
            const data = await response.json();
            return data.user || data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user from API:', error);
        throw error;
    }
};

/**
 * Get user data - tries Firestore first, then API, then stores in Firestore
 */
export const getUserData = async (userId: string): Promise<UserData | null> => {
    try {
        // First, try to get from Firestore
        let userData = await getUserFromFirestore(userId);

        if (userData) {
            return userData;
        }

        // If not in Firestore, try to get from API
        userData = await getUserFromAPI(userId);

        if (userData) {
            // Store in Firestore for future use
            await saveUserToFirestore(userId, userData);
            return userData;
        }

        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

/**
 * Save user data to Firestore
 */
export const saveUserToFirestore = async (userId: string, userData: UserData): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        await setDoc(userDocRef, {
            // Store in Firestore as snake_case (matches your DB screenshot)
            first_name: userData.firstName,
            middle_name: userData.middleName || null,
            last_name: userData.lastName,
            email: userData.email,
            phone_number: userData.phoneNumber,
            address: userData.address || null,
            photo: userData.photo || null,
            dob: userData.dob || null,
            createdAt: userData.createdAt ? Timestamp.fromDate(userData.createdAt) : Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error saving user to Firestore:', error);
        throw error;
    }
};

/**
 * Update user data in Firestore
 */
export const updateUserInFirestore = async (userId: string, updates: Partial<UserData>): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        // Map camelCase -> snake_case for Firestore storage
        const updateData: any = {
            updatedAt: Timestamp.now(),
        };

        if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
        if (updates.middleName !== undefined) updateData.middle_name = updates.middleName;
        if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
        if (updates.email !== undefined) updateData.email = updates.email;
        if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
        if (updates.address !== undefined) updateData.address = updates.address;
        if (updates.photo !== undefined) updateData.photo = updates.photo;
        if (updates.dob !== undefined) updateData.dob = updates.dob;

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        await updateDoc(userDocRef, updateData);
    } catch (error) {
        console.error('Error updating user in Firestore:', error);
        throw error;
    }
};

/**
 * Register user via API and save to Firestore
 */
export const registerUser = async (userData: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserData | null> => {
    try {
        const response = await fetch(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (response.ok) {
            const data = await response.json();
            const registeredUser = data.user || data;

            // Save to Firestore
            if (registeredUser.id) {
                await saveUserToFirestore(registeredUser.id, {
                    ...userData,
                    id: registeredUser.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            return registeredUser;
        }
        return null;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

/**
 * Get user data with Firebase Auth user info merged
 * This combines Firebase Auth data (from currentUser) with stored user data
 */
export const getUserDataWithAuth = async (firebaseUser: any): Promise<UserData | null> => {
    try {
        console.log('🔍 getUserDataWithAuth called for UID:', firebaseUser.uid);

        // Base data from Firebase Auth (always immediate)
        const nameParts = firebaseUser.displayName?.split(' ') || [];
        const base: UserData = {
            firstName: nameParts[0] || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            lastName: nameParts.slice(1).join(' ') || '',
            email: firebaseUser.email || '',
            phoneNumber: firebaseUser.phoneNumber || '',
            photo: firebaseUser.photoURL || null,
        };

        // Fetch extra fields (address, dob, etc.) from Firestore ONLY, with timeout.
        // (This avoids hanging on backend API fetches and keeps the UI responsive.)
        try {
            console.log('📡 Fetching user profile from Firestore (users/{uid})...');
            const stored = await withTimeout(getUserFromFirestore(firebaseUser.uid), 4000, 'Firestore user read');
            console.log('📦 Firestore user profile:', stored);

            if (stored) {
                return {
                    ...base,
                    ...stored,
                    email: stored.email || base.email,
                    photo: stored.photo || base.photo,
                };
            }
        } catch (e) {
            console.warn('⚠️ Firestore user profile read failed/timeout; using Firebase Auth data only:', e);
        }

        return base;
    } catch (error) {
        console.error('❌ Error getting user data with auth:', error);
        return null;
    }
};

