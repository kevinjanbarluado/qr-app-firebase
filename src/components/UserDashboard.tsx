import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserQRCode } from '../services/qrService';
import { generateQRCodeForUser } from '../services/qrGenerator';
import { getUserDataWithAuth } from '../services/userService';
import type { UserData } from '../types/user';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const userDataRef = useRef<UserData | null>(null);

    // Keep a ref so generateQRCode doesn't need to depend on userData (prevents effect re-run loops)
    useEffect(() => {
        userDataRef.current = userData;
    }, [userData]);

    const generateQRCode = useCallback(async () => {
        if (!currentUser) {
            console.warn('⚠️ Cannot generate QR code: no current user');
            setError('No user logged in');
            return;
        }

        console.log('🔄 Starting QR code generation for Firebase UID:', currentUser.uid);
        setIsGenerating(true);
        setError(null);
        setIsLoading(false);

        try {
            // Get user name - use userData if available, otherwise use Firebase Auth data
            let userName = 'User';
            const ud = userDataRef.current;
            if (ud && ud.firstName) {
                userName = `${ud.firstName} ${ud.lastName || ''}`.trim();
            } else if (currentUser.displayName) {
                userName = currentUser.displayName;
            } else if (currentUser.email) {
                userName = currentUser.email.split('@')[0];
            }

            console.log('👤 Using user name for QR code:', userName);
            console.log('📧 User email:', currentUser.email);

            const qrCodeDataURL = await generateQRCodeForUser(
                currentUser.uid,
                currentUser.email || '',
                {
                    name: userName,
                    email: currentUser.email || '',
                }
            );

            console.log('✅ QR code generated successfully! Length:', qrCodeDataURL.length);
            setQrCode(qrCodeDataURL);
            setError(null);
        } catch (err: any) {
            console.error('❌ Error generating QR code locally:', err);
            console.error('Error details:', {
                message: err?.message,
                stack: err?.stack,
                name: err?.name,
            });
            const errorMessage = err?.message || err?.toString() || 'Failed to generate QR code. Please try again later.';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                console.log('🔍 Loading user data for UID:', currentUser.uid);
                console.log('📧 User email:', currentUser.email);
                console.log('👤 Firebase Auth user:', {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                });

                // Load user data (name, photo, address, etc.)
                const data = await getUserDataWithAuth(currentUser);
                console.log('✅ User data fetched:', data);
                console.log('📍 User address:', data?.address ?? '(none)');
                console.log('🎂 User birth date (dob):', data?.dob ?? '(none)');
                setUserData(data);

                // If profile is incomplete, redirect to profile setup first
                const needsProfile =
                    !data?.firstName ||
                    !data?.lastName ||
                    !data?.phoneNumber ||
                    !data?.address ||
                    !data?.dob;
                if (needsProfile) {
                    console.log('🧩 Profile incomplete, redirecting to /profile');
                    setIsLoading(false);
                    navigate('/profile', { replace: true });
                    return;
                }

                // Load QR code using Firebase UID - check Firestore first
                console.log('🔍 Checking Firestore for QR code for UID:', currentUser.uid);
                const qr = await getUserQRCode(currentUser.uid, currentUser.email || '');
                if (qr) {
                    console.log('✅ QR code found in Firestore');
                    setQrCode(qr);
                    setIsLoading(false);
                } else {
                    console.log('⚠️ QR code not found, generating locally...');
                    setIsLoading(false);
                    // Generate QR code locally immediately - don't await, let it run
                    generateQRCode().catch((err) => {
                        console.error('❌ Failed to generate QR code:', err);
                        setError(`Failed to generate QR code: ${err.message || 'Unknown error'}`);
                    });
                }
            } catch (err) {
                console.error('❌ Error loading user data:', err);
                setError('Failed to load data. Please try again.');
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [currentUser, generateQRCode]);

    const handleDownloadQR = () => {
        if (!qrCode) return;

        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `qr-code-${currentUser?.uid || 'user'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="user-dashboard-container">
            <div className="dashboard-card">
                <div className="dashboard-header">
                    <div className="user-info">
                        {(userData?.photo || currentUser?.photoURL) && (
                            <img
                                src={userData?.photo || currentUser?.photoURL || ''}
                                alt="Profile"
                                className="profile-picture"
                            />
                        )}
                        <div>
                            <h1>Welcome, {userData ? `${userData.firstName} ${userData.lastName}`.trim() : currentUser?.displayName || currentUser?.email}</h1>
                            <p className="user-email">{userData?.email || currentUser?.email}</p>
                            {userData?.address && (
                                <p className="user-address">📍 {userData.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                {(isLoading || isGenerating) && (
                    <div className="loading-section">
                        <div className="loading-spinner">
                            {isGenerating ? 'Generating QR code...' : 'Loading QR code...'}
                        </div>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="error-message">
                        {error}
                        {!qrCode && (
                            <button onClick={generateQRCode} disabled={isGenerating} className="retry-btn">
                                {isGenerating ? 'Generating...' : 'Generate QR Code'}
                            </button>
                        )}
                    </div>
                )}

                {qrCode && !isLoading && (
                    <div className="qr-section">
                        <h2>Your QR Code</h2>
                        <p className="qr-description">
                            Share this QR code to allow others to access your information
                        </p>
                        <div className="qr-code-container">
                            <img src={qrCode} alt="QR Code" className="qr-code-image" />
                        </div>
                        <div className="qr-actions">
                            <button onClick={handleDownloadQR} className="download-btn">
                                📥 Download QR Code
                            </button>
                            <button onClick={() => logout()} className="logout-action-btn">
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {!qrCode && !error && !isLoading && !isGenerating && (
                    <div className="no-qr-message">
                        <p>No QR code found. Click to generate one.</p>
                        <button onClick={generateQRCode} className="generate-btn" disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Generate QR Code'}
                        </button>
                    </div>
                )}

                {!qrCode && !error && isGenerating && (
                    <div className="loading-section">
                        <div className="loading-spinner">Generating QR code... Please wait...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;

