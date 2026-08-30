import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { useNavigate } from 'react-router-dom';
import { getUserFromFirestore } from '../services/userService';
import { APP_NAME } from '../config/app';
import { parseQrUserId } from '../utils/qrPayload';
import './AdminDashboard.css';

interface AdminDashboardProps {
    onLogout: () => void | Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const navigate = useNavigate();

    const startScanning = async () => {
        try {
            if (!videoRef.current) return;

            setError(null);
            setMessage(null);
            setIsScanning(true);

            const hasCamera = await QrScanner.hasCamera();
            if (!hasCamera) {
                setError('No camera found on this device.');
                setIsScanning(false);
                return;
            }

            qrScannerRef.current = new QrScanner(
                videoRef.current,
                (result) => {
                    handleQRResult(result.data);
                },
                {
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: 'environment',
                }
            );

            await qrScannerRef.current.start();
            setMessage('Point the camera at a member QR code.');
        } catch (err) {
            console.error('Camera error:', err);
            setError('Failed to start camera. Please check permissions and try again.');
            setIsScanning(false);
        }
    };

    const stopScanning = () => {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }
        setIsScanning(false);
    };

    const handleQRResult = async (qrData: string) => {
        try {
            console.log('📱 QR Code scanned:', qrData);

            const userId = parseQrUserId(qrData);

            if (!userId) {
                setError('Invalid QR code format. Could not extract user ID.');
                return;
            }

            const userData = await getUserFromFirestore(userId);

            if (userData) {
                stopScanning();

                const userForDetails = {
                    id: userData.id || userId,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    address: userData.address,
                    photo: userData.photo,
                    dob: userData.dob,
                    createdAt: userData.createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: userData.updatedAt?.toISOString() || new Date().toISOString(),
                };

                navigate('/user-details', { state: { user: userForDetails } });
            } else {
                setError('User not found in database.');
            }
        } catch (err) {
            console.error('❌ Error processing QR code:', err);
            setError(err instanceof Error ? err.message : 'Failed to process QR code. Please try again.');
        }
    };

    useEffect(() => {
        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="page page--stack">
            <div className="shell shell--lg">
                <header className="page-header">
                    <div className="page-header__copy">
                        <p className="brand">{APP_NAME}</p>
                        <h1 className="page-title">Scanner</h1>
                        <p className="page-subtitle">Scan a member QR code to view their details.</p>
                    </div>
                    <div className="page-header__actions">
                        <button type="button" onClick={() => onLogout()} className="btn btn--ghost">
                            Sign out
                        </button>
                    </div>
                </header>

                <div className="card">
                    <div className="scanner-controls">
                        {!isScanning ? (
                            <button type="button" onClick={startScanning} className="btn btn--primary">
                                Start scanner
                            </button>
                        ) : (
                            <button type="button" onClick={stopScanning} className="btn btn--danger">
                                Stop scanner
                            </button>
                        )}
                    </div>

                    <div className={`video-container${isScanning ? ' is-live' : ''}`}>
                        <video ref={videoRef} className="scanner-video" playsInline muted />
                        {!isScanning && (
                            <div className="camera-placeholder">
                                <svg className="camera-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                                    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                                    <path d="M8 6l1.2-2h5.6L16 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                <p>Camera is off</p>
                                <p className="page-subtitle">Allow camera access when prompted.</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="alert alert--error" role="alert">
                            {error}
                        </div>
                    )}

                    {message && isScanning && (
                        <div className="alert alert--info">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
