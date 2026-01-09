// Firestore Example - How to use Firestore database with Firebase
// This file shows common Firestore operations you can use in your app

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// EXAMPLE: Create/Add a document
// ============================================
export const createUser = async (userId: string, userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    createdAt: Date;
}) => {
    try {
        // Option 1: Set with a specific document ID
        await setDoc(doc(db, 'users', userId), {
            ...userData,
            createdAt: Timestamp.fromDate(userData.createdAt),
            updatedAt: Timestamp.now(),
        });
        console.log('User created with ID:', userId);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Option 2: Add a document with auto-generated ID
export const addUserWithAutoId = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
}) => {
    try {
        const docRef = await addDoc(collection(db, 'users'), {
            ...userData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        console.log('User created with auto ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
};

// ============================================
// EXAMPLE: Read a single document
// ============================================
export const getUser = async (userId: string) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamp to JavaScript Date
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            };
        } else {
            console.log('No such document!');
            return null;
        }
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
};

// ============================================
// EXAMPLE: Read all documents in a collection
// ============================================
export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users: any[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            });
        });

        return users;
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};

// ============================================
// EXAMPLE: Query with filters
// ============================================
export const getUsersByEmail = async (email: string) => {
    try {
        const q = query(
            collection(db, 'users'),
            where('email', '==', email),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const users: any[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
            });
        });

        return users;
    } catch (error) {
        console.error('Error querying users:', error);
        throw error;
    }
};

// ============================================
// EXAMPLE: Update a document
// ============================================
export const updateUser = async (userId: string, updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
}) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
        console.log('User updated:', userId);
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// ============================================
// EXAMPLE: Delete a document
// ============================================
export const deleteUser = async (userId: string) => {
    try {
        await deleteDoc(doc(db, 'users', userId));
        console.log('User deleted:', userId);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// ============================================
// EXAMPLE: Real-time listener (subscribe to changes)
// ============================================
import { onSnapshot } from 'firebase/firestore';

export const subscribeToUser = (userId: string, callback: (user: any) => void) => {
    const userRef = doc(db, 'users', userId);

    // This returns an unsubscribe function
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            callback({
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Error listening to user:', error);
    });
};

// Usage example:
// const unsubscribe = subscribeToUser('user123', (user) => {
//   console.log('User data changed:', user);
// });
// // Later, to stop listening:
// unsubscribe();

// ============================================
// EXAMPLE: Batch operations (multiple writes at once)
// ============================================
import { writeBatch } from 'firebase/firestore';

export const batchUpdateUsers = async (updates: Array<{ id: string; data: any }>) => {
    try {
        const batch = writeBatch(db);

        updates.forEach(({ id, data }) => {
            const userRef = doc(db, 'users', id);
            batch.update(userRef, {
                ...data,
                updatedAt: Timestamp.now(),
            });
        });

        await batch.commit();
        console.log('Batch update completed');
    } catch (error) {
        console.error('Error in batch update:', error);
        throw error;
    }
};
