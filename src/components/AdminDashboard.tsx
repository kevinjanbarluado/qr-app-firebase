import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
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
            const response = await fetch(API_ENDPOINTS.SCAN_QR, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qrData }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.exists) {
                    // Stop scanning and redirect to user details page
                    stopScanning();
                    navigate('/user-details', { state: { user: data.user } });
                } else {
                    setMessage('User not found');
                }
            } else {
                setError(data.error || 'Failed to scan QR code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
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
