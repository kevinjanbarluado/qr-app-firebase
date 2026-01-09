import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './UserDetails.css';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    photo?: string;
    dob?: string;
    createdAt: string;
    updatedAt: string;
}

const UserDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user: User = location.state?.user;

    const handleBack = () => {
        navigate('/admin');
    };

    if (!user) {
        return (
            <div className="user-details-container">
                <div className="error-card">
                    <h2>No User Data</h2>
                    <p>No user information was found.</p>
                    <button onClick={handleBack} className="back-btn">
                        Back to Scanner
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-details-container">
            <div className="user-details-card">
                <div className="header">
                    <h1>User Details</h1>
                    <button onClick={handleBack} className="back-btn">
                        ← Back to Scanner
                    </button>
                </div>

                <div className="user-info-section">
                    <div className="user-avatar">
                        {user.photo ? (
                            <img src={`${window.location.protocol}//${window.location.hostname}:3001${user.photo}`}
                                alt="User Photo"
                                className="user-photo" />
                        ) : (
                            <div className="avatar-circle">
                                {user.firstName.charAt(0).toUpperCase()}
                                {user.lastName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="user-details-grid">
                        <div className="detail-item">
                            <label>Full Name</label>
                            <span>{user.firstName} {user.lastName}</span>
                        </div>

                        <div className="detail-item">
                            <label>Email Address</label>
                            <span>{user.email}</span>
                        </div>

                        <div className="detail-item">
                            <label>Phone Number</label>
                            <span>{user.phoneNumber}</span>
                        </div>

                        {user.address && (
                            <div className="detail-item">
                                <label>Address</label>
                                <span>{user.address}</span>
                            </div>
                        )}

                        {user.dob && (
                            <div className="detail-item">
                                <label>Date of Birth</label>
                                <span>{new Date(user.dob).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                        )}

                        <div className="detail-item">
                            <label>Registration Date</label>
                            <span>{new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>

                        <div className="detail-item">
                            <label>Last Updated</label>
                            <span>{new Date(user.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                    </div>
                </div>

                <div className="actions">
                    <button onClick={handleBack} className="primary-btn">
                        Scan Another QR Code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
