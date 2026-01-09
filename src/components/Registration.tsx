import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import './Registration.css';

interface User {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    dob?: string;
    photo?: string;
}

const Registration: React.FC = () => {
    const [formData, setFormData] = useState<User>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        dob: '',
        photo: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadPhoto = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const response = await fetch(`${API_BASE_URL}/api/upload-photo`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                return data.photoUrl;
            }
            return null;
        } catch (error) {
            console.error('Error uploading photo:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // Upload photo first if selected
            let photoUrl = null;
            if (photoFile) {
                photoUrl = await uploadPhoto(photoFile);
                if (!photoUrl) {
                    setMessage({ type: 'error', text: 'Failed to upload photo' });
                    setIsLoading(false);
                    return;
                }
            }

            // Register user with photo URL
            const response = await fetch(API_ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    photo: photoUrl
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Registration successful!' });
                setUserId(data.user.id);

                // Generate QR code
                const qrResponse = await fetch(API_ENDPOINTS.QR_CODE(data.user.id));
                const qrData = await qrResponse.json();

                if (qrResponse.ok) {
                    setQrCode(qrData.qrCode);
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Registration failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadQR = () => {
        if (!qrCode) return;

        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `qr-code-${formData.firstName}-${formData.lastName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="registration-container">
            <div className="registration-card">
                <h1>User Registration</h1>
                <p>Register to get your QR code</p>

                <form onSubmit={handleSubmit} className="registration-form">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address (Optional)</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Enter your address"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="photo">Photo (Optional)</label>
                        <input
                            type="file"
                            id="photo"
                            name="photo"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                        {photoPreview && (
                            <div className="photo-preview">
                                <img src={photoPreview} alt="Preview" />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="dob">Date of Birth (Optional)</label>
                        <input
                            type="date"
                            id="dob"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {qrCode && userId && (
                    <div className="qr-section">
                        <h3>Your QR Code</h3>
                        <div className="qr-code-container">
                            <img src={qrCode} alt="QR Code" className="qr-code" />
                        </div>
                        <div className="qr-actions">
                            <button onClick={handleDownloadQR} className="download-btn">
                                📥 Download QR Code
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Registration;
