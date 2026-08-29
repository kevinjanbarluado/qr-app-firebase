import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../config/app';
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
            <div className="page page--center">
                <div className="shell shell--sm">
                    <div className="card">
                        <h1 className="page-title">No member found</h1>
                        <p className="page-subtitle">There is no user information to show.</p>
                        <div className="stack-actions">
                            <button type="button" onClick={handleBack} className="btn btn--primary btn--block">
                                Back to scanner
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Member';
    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    const hasPhoto = Boolean(user.photo && (user.photo.startsWith('http://') || user.photo.startsWith('https://')));

    return (
        <div className="page page--stack">
            <div className="shell shell--lg">
                <header className="page-header">
                    <div className="page-header__copy">
                        <p className="brand">{APP_NAME}</p>
                        <h1 className="page-title">Member</h1>
                        <p className="page-subtitle">Details from the scanned QR code.</p>
                    </div>
                    <div className="page-header__actions">
                        <button type="button" onClick={handleBack} className="btn btn--ghost">
                            Back
                        </button>
                    </div>
                </header>

                <div className="card">
                    <div className="member-hero">
                        {hasPhoto ? (
                            <img
                                src={user.photo}
                                alt=""
                                className="avatar avatar--lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.parentElement?.querySelector('.avatar--initials') as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="avatar avatar--lg avatar--initials"
                            style={{ display: hasPhoto ? 'none' : 'flex' }}
                        >
                            {initials}
                        </div>
                        <h2 className="identity__name">{fullName}</h2>
                    </div>

                    <dl className="details-list">
                        <div className="detail-row">
                            <dt>Email</dt>
                            <dd>{user.email}</dd>
                        </div>
                        <div className="detail-row">
                            <dt>Phone</dt>
                            <dd>{user.phoneNumber}</dd>
                        </div>
                        {user.address && (
                            <div className="detail-row">
                                <dt>Address</dt>
                                <dd>{user.address}</dd>
                            </div>
                        )}
                        {user.dob && (
                            <div className="detail-row">
                                <dt>Date of birth</dt>
                                <dd>{new Date(user.dob).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</dd>
                            </div>
                        )}
                        <div className="detail-row">
                            <dt>Registered</dt>
                            <dd>{new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}</dd>
                        </div>
                        <div className="detail-row">
                            <dt>Updated</dt>
                            <dd>{new Date(user.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}</dd>
                        </div>
                    </dl>

                    <div className="stack-actions member-actions">
                        <button type="button" onClick={handleBack} className="btn btn--primary btn--block">
                            Scan another
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
