import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { useNavigate } from 'react-router-dom';
import { getUserFromFirestore } from '../services/userService';
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

            // Check if camera is available
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
                    preferredCamera: 'environment', // Use back camera if available
                }
            );

            await qrScannerRef.current.start();
            setMessage('Camera started! Point at a QR code to scan.');
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
            
            // Parse QR code data - it should contain a UID
            let userId: string | null = null;
            
            try {
                // Try to parse as JSON first (QR codes might contain JSON with uid field)
                const parsed = JSON.parse(qrData);
                userId = parsed.uid || parsed.userId || parsed.id || null;
            } catch {
                // If not JSON, assume the QR data itself is the UID
                userId = qrData.trim();
            }

            if (!userId) {
                setError('Invalid QR code format. Could not extract user ID.');
                return;
            }

            console.log('🔍 Looking up user with UID:', userId);

            // Fetch user data directly from Firestore
            const userData = await getUserFromFirestore(userId);

            if (userData) {
                console.log('✅ User found:', userData);
                // Stop scanning and redirect to user details page
                stopScanning();
                
                // Convert UserData to the format expected by UserDetails component
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
                console.warn('⚠️ No user found for UID:', userId);
            }
        } catch (err) {
            console.error('❌ Error processing QR code:', err);
            setError(err instanceof Error ? err.message : 'Failed to process QR code. Please try again.');
        }
    };

    const clearResults = () => {
        setMessage(null);
        setError(null);
    };

    useEffect(() => {
        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="admin-dashboard-container">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <button onClick={() => onLogout()} className="logout-btn">
                    Logout
                </button>
            </div>

            <div className="scanner-section">
                <div className="scanner-controls">
                    {!isScanning ? (
                        <button onClick={startScanning} className="scan-btn">
                            Start QR Scanner
                        </button>
                    ) : (
                        <button onClick={stopScanning} className="stop-btn">
                            Stop Scanner
                        </button>
                    )}

                    <button onClick={clearResults} className="clear-btn">
                        Clear Results
                    </button>
                </div>

                <div className="video-container">
                    <video ref={videoRef} className="scanner-video" />
                    {!isScanning && (
                        <div className="camera-placeholder">
                            <div className="placeholder-content">
                                <div className="camera-icon">📷</div>
                                <h3>QR Code Scanner</h3>
                                <p>Click "Start QR Scanner" to begin scanning QR codes</p>
                                <p className="instruction-text">
                                    Make sure to allow camera permissions when prompted
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="message">
                        {message}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
