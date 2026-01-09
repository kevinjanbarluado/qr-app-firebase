// AuthContext - Manages Firebase authentication state
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { isAdminEmail } from '../config/adminConfig';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isAdminLoggedIn: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // If user is logged in but not admin, sign them out
            // This provides an extra security layer
            if (user && !isAdminEmail(user.email)) {
                // Only sign out if we're on an admin route
                // Check if current path is /admin or /admin-login
                const currentPath = window.location.pathname;
                if (currentPath === '/admin' || currentPath === '/admin-login') {
                    await signOut(auth);
                    return;
                }
            }
            setCurrentUser(user);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    // Check if current user is an admin
    const isAdmin = currentUser ? isAdminEmail(currentUser.email) : false;

    const login = async (email: string, password: string) => {
        // Check if email is admin before attempting login
        if (!isAdminEmail(email)) {
            throw new Error('Access denied. Only admin@perlasngsilangan.com can access this page.');
        }
        
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Double-check after login (in case email changed)
        if (!isAdminEmail(result.user.email)) {
            await signOut(auth);
            throw new Error('Access denied. Only admin@perlasngsilangan.com can access this page.');
        }
        
        // onAuthStateChanged will automatically update currentUser
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will automatically update currentUser
        // Note: loginWithGoogle is used by regular users, not just admins
    };

    const logout = async () => {
        await signOut(auth);
        // onAuthStateChanged will automatically update currentUser
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        login,
        loginWithGoogle,
        logout,
        isAdminLoggedIn: !!currentUser, // User is logged in if currentUser exists
        isAdmin, // Admin status based on email check
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
