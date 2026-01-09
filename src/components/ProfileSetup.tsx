// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserFromFirestore, saveUserToFirestore } from '../services/userService';
import type { UserData } from '../types/user';
import { USERS_COLLECTION } from '../config/firestoreCollections';
import './ProfileSetup.css';

const isProfileComplete = (u: UserData | null) => {
    if (!u) return false;
    return Boolean(u.firstName && u.lastName && u.phoneNumber && u.address && u.dob);
};

const ProfileSetup: React.FC = () => {
    const { currentUser } = useAuth();
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
            setError('Please fill first name, last name, DOB, address, and phone number.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            // Email is taken from Google Auth; user does not edit it here.
            await saveUserToFirestore(currentUser.uid, {
                ...form,
                email: currentUser.email ?? form.email,
                photo: currentUser.photoURL ?? form.photo,
            });
            console.log('✅ Profile saved to Firestore (users/{uid})', { uid: currentUser.uid });
            navigate('/dashboard', { replace: true });
        } catch (e: any) {
            // Firestore rule errors show as "Missing or insufficient permissions."
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
            <div className="profile-setup-container">
                <div className="profile-card">
                    <h1>Sign in required</h1>
                    <p>Please sign in first.</p>
                    <button className="primary-btn" onClick={() => navigate('/login')}>Go to Login</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-setup-container">
                <div className="profile-card">
                    <div className="loading">Loading profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-setup-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-title">
                        <h1>Complete your profile</h1>
                        <p>Fill this once. We’ll save it in Firebase (Firestore).</p>
                    </div>
                    {currentUser.photoURL && (
                        <img className="avatar" src={currentUser.photoURL} alt="Profile" />
                    )}
                </div>

                <form onSubmit={onSubmit} className="profile-form">
                    <div className="grid">
                        <div className="field">
                            <label>First name</label>
                            <input name="firstName" value={form.firstName} onChange={onChange} placeholder="First name" />
                        </div>

                        <div className="field">
                            <label>Middle name (optional)</label>
                            <input name="middleName" value={form.middleName ?? ''} onChange={onChange} placeholder="Middle name" />
                        </div>

                        <div className="field">
                            <label>Last name</label>
                            <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Last name" />
                        </div>

                        <div className="field">
                            <label>Date of birth</label>
                            <input name="dob" type="date" value={form.dob ?? ''} onChange={onChange} />
                        </div>

                        <div className="field full">
                            <label>Address</label>
                            <textarea name="address" value={form.address ?? ''} onChange={onChange} placeholder="Address" rows={3} />
                        </div>

                        <div className="field">
                            <label>Phone number</label>
                            <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="Phone number" />
                        </div>

                        <div className="field">
                            <label>Email (from Google)</label>
                            <input value={email} disabled />
                        </div>
                    </div>

                    {error && <div className="error">{error}</div>}

                    <button type="submit" className="primary-btn" disabled={saving || !canSubmit}>
                        {saving ? 'Saving...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;

