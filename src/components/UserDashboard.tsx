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
                const data = await getUserDataWithAuth(currentUser);
                setUserData(data);

                const needsProfile =
                    !data?.firstName ||
                    !data?.lastName ||
                    !data?.phoneNumber ||
                    !data?.address ||
                    !data?.dob;
                if (needsProfile) {
                    setIsLoading(false);
                    navigate('/profile', { replace: true });
                    return;
                }

                const qr = await getUserQRCode(currentUser.uid, currentUser.email || '');
                if (qr) {
                    setQrCode(qr);
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
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
    }, [currentUser, generateQRCode, navigate]);

    const handleDownloadQR = () => {
        if (!qrCode) return;

        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `qr-code-${currentUser?.uid || 'user'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const displayName = userData
        ? `${userData.firstName} ${userData.lastName}`.trim()
        : currentUser?.displayName || currentUser?.email || 'Member';
    const photo = userData?.photo || currentUser?.photoURL || '';
    const initials = userData
        ? `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase()
        : displayName.charAt(0).toUpperCase();

    return (
        <div className="page page--stack">
            <div className="shell shell--md">
                <header className="page-header">
                    <div className="identity">
                        {photo ? (
                            <img src={photo} alt="" className="avatar" />
                        ) : (
                            <div className="avatar avatar--initials">{initials}</div>
                        )}
                        <div className="identity__text">
                            <h1 className="identity__name">{displayName}</h1>
                            <p className="identity__meta">{userData?.email || currentUser?.email}</p>
                            {userData?.address && (
                                <p className="identity__meta">{userData.address}</p>
                            )}
                        </div>
                    </div>
                    <div className="page-header__actions">
                        <button type="button" onClick={() => logout()} className="btn btn--ghost">
                            Sign out
                        </button>
                    </div>
                </header>

                <div className="card">
                    {(isLoading || isGenerating) && (
                        <div className="loading">
                            <div className="spinner" aria-hidden="true" />
                            {isGenerating ? 'Generating QR code…' : 'Loading QR code…'}
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="alert alert--error" role="alert">
                            {error}
                            {!qrCode && (
                                <div className="stack-actions">
                                    <button type="button" onClick={generateQRCode} disabled={isGenerating} className="btn btn--primary btn--block">
                                        {isGenerating ? 'Generating…' : 'Generate QR code'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {qrCode && !isLoading && (
                        <div className="qr-block">
                            <p className="section-title">Your QR code</p>
                            <p className="page-subtitle">Show this code to identify yourself.</p>
                            <div className="qr-frame">
                                <img src={qrCode} alt="Your QR code" />
                            </div>
                            <div className="stack-actions">
                                <button type="button" onClick={handleDownloadQR} className="btn btn--primary btn--block">
                                    Download
                                </button>
                            </div>
                        </div>
                    )}

                    {!qrCode && !error && !isLoading && !isGenerating && (
                        <div className="qr-block">
                            <p className="page-subtitle">No QR code yet.</p>
                            <div className="stack-actions">
                                <button type="button" onClick={generateQRCode} className="btn btn--primary btn--block" disabled={isGenerating}>
                                    {isGenerating ? 'Generating…' : 'Generate QR code'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
