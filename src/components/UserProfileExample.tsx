// Example Component - How to fetch and display user data
// This shows you how to use the userService to get name, photo, address, etc.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDataWithAuth } from '../services/userService';
import type { UserData } from '../types/user';

const UserProfileExample: React.FC = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Option 1: Get user data with Firebase Auth info merged
                const data = await getUserDataWithAuth(currentUser);
                setUserData(data);

                // Option 2: Get user data by ID (tries Firestore, then API)
                // const data = await getUserData(currentUser.uid);
                // setUserData(data);
            } catch (err) {
                console.error('Error loading user data:', err);
                setError('Failed to load user data');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [currentUser]);

    if (isLoading) {
        return <div>Loading user data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!userData) {
        return <div>No user data found</div>;
    }

    return (
        <div className="user-profile">
            <h2>User Profile Example</h2>

            {/* Display Photo */}
            {userData.photo && (
                <div className="profile-photo">
                    <img src={userData.photo} alt="Profile" />
                </div>
            )}

            {/* Display Name */}
            <div className="profile-info">
                <h3>Name</h3>
                <p>
                    <strong>First Name:</strong> {userData.firstName}
                </p>
                <p>
                    <strong>Last Name:</strong> {userData.lastName}
                </p>
                <p>
                    <strong>Full Name:</strong> {userData.firstName} {userData.lastName}
                </p>
            </div>

            {/* Display Contact Info */}
            <div className="profile-info">
                <h3>Contact Information</h3>
                <p>
                    <strong>Email:</strong> {userData.email}
                </p>
                <p>
                    <strong>Phone:</strong> {userData.phoneNumber}
                </p>
            </div>

            {/* Display Address */}
            {userData.address && (
                <div className="profile-info">
                    <h3>Address</h3>
                    <p>{userData.address}</p>
                </div>
            )}

            {/* Display Date of Birth */}
            {userData.dob && (
                <div className="profile-info">
                    <h3>Date of Birth</h3>
                    <p>{userData.dob}</p>
                </div>
            )}

            {/* Display Timestamps */}
            {userData.createdAt && (
                <div className="profile-info">
                    <p>
                        <small>Member since: {userData.createdAt.toLocaleDateString()}</small>
                    </p>
                </div>
            )}
        </div>
    );
};

export default UserProfileExample;

