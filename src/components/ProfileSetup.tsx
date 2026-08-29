// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserFromFirestore, saveUserToFirestore } from '../services/userService';
import type { UserData } from '../types/user';
import { USERS_COLLECTION } from '../config/firestoreCollections';
import { APP_NAME } from '../config/app';
import './ProfileSetup.css';

const isProfileComplete = (u: UserData | null) => {
    if (!u) return false;
    return Boolean(u.firstName && u.lastName && u.phoneNumber && u.address && u.dob);
};

const ProfileSetup: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const email = currentUser?.email ?? '';

    const [form, setForm] = useState<UserData>({
        firstName: '',
        middleName: '',
        lastName: '',
        email,
        phoneNumber: '',
        address: '',
        dob: '',
        photo: currentUser?.photoURL ?? undefined,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        return Boolean(form.firstName && form.lastName && form.phoneNumber && form.address && form.dob);
    }, [form]);

    useEffect(() => {
        const run = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const existing = await getUserFromFirestore(currentUser.uid);
                if (existing && isProfileComplete(existing)) {
                    navigate('/dashboard', { replace: true });
                    return;
                }

                setForm((prev) => ({
                    ...prev,
                    email: currentUser.email ?? prev.email,
                    photo: currentUser.photoURL ?? prev.photo,
                    firstName: existing?.firstName || prev.firstName,
                    middleName: existing?.middleName || prev.middleName,
                    lastName: existing?.lastName || prev.lastName,
                    phoneNumber: existing?.phoneNumber || prev.phoneNumber,
                    address: existing?.address || prev.address,
                    dob: existing?.dob || prev.dob,
                }));
            } catch (e: any) {
                setError(e?.message ?? 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [currentUser, navigate]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!canSubmit) {
            setError('Please fill first name, last name, date of birth, address, and phone number.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await saveUserToFirestore(currentUser.uid, {
                ...form,
                email: currentUser.email ?? form.email,
                photo: currentUser.photoURL ?? form.photo,
            });
            console.log('✅ Profile saved to Firestore (users/{uid})', { uid: currentUser.uid });
            navigate('/dashboard', { replace: true });
        } catch (e: any) {
            if (e?.code === 'permission-denied' || String(e?.message || '').includes('Missing or insufficient permissions')) {
                setError(
                    `Missing or insufficient permissions. Update Firestore Rules to allow write to ${USERS_COLLECTION}/{uid} (uid=${currentUser.uid}).`
                );
            } else {
                setError(e?.message ?? 'Failed to save profile');
            }
        } finally {
            setSaving(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="page page--center">
                <div className="shell shell--sm">
                    <div className="card">
                        <p className="brand">{APP_NAME}</p>
                        <h1 className="page-title">Sign in required</h1>
                        <p className="page-subtitle">Please sign in to continue.</p>
                        <div className="auth-actions">
                            <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/login')}>
                                Go to login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page page--center">
                <div className="shell shell--sm">
                    <div className="card">
                        <div className="loading">
                            <div className="spinner" aria-hidden="true" />
                            Loading profile…
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page page--stack">
            <div className="shell shell--lg">
                <header className="page-header">
                    <div className="page-header__copy">
                        <p className="brand">{APP_NAME}</p>
                        <h1 className="page-title">Complete your profile</h1>
                        <p className="page-subtitle">A few details so we can generate your QR code.</p>
                    </div>
                    <div className="page-header__actions">
                        <button type="button" className="btn btn--ghost" onClick={() => logout()}>
                            Sign out
                        </button>
                    </div>
                </header>

                <div className="card">
                    <div className="profile-intro">
                        {currentUser.photoURL && (
                            <img className="avatar" src={currentUser.photoURL} alt="" />
                        )}
                        <p className="identity__meta">{email}</p>
                    </div>

                    <form onSubmit={onSubmit} className="form">
                        <div className="form-grid">
                            <div className="field">
                                <label htmlFor="firstName">First name</label>
                                <input id="firstName" name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" required />
                            </div>

                            <div className="field">
                                <label htmlFor="middleName">Middle name</label>
                                <input id="middleName" name="middleName" value={form.middleName ?? ''} onChange={onChange} placeholder="Optional" />
                            </div>

                            <div className="field">
                                <label htmlFor="lastName">Last name</label>
                                <input id="lastName" name="lastName" value={form.lastName} onChange={onChange} placeholder="Last name" required />
                            </div>

                            <div className="field">
                                <label htmlFor="dob">Date of birth</label>
                                <input id="dob" name="dob" type="date" value={form.dob ?? ''} onChange={onChange} required />
                            </div>

                            <div className="field field--full">
                                <label htmlFor="address">Address</label>
                                <textarea id="address" name="address" value={form.address ?? ''} onChange={onChange} placeholder="Street, city" rows={3} required />
                            </div>

                            <div className="field">
                                <label htmlFor="phoneNumber">Phone number</label>
                                <input id="phoneNumber" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={onChange} placeholder="Phone number" required />
                            </div>

                            <div className="field">
                                <label htmlFor="email">Email</label>
                                <input id="email" value={email} disabled />
                            </div>
                        </div>

                        {error && <div className="alert alert--error" role="alert">{error}</div>}

                        <button type="submit" className="btn btn--primary btn--block" disabled={saving || !canSubmit}>
                            {saving ? 'Saving…' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
