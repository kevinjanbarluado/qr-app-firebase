import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../config/adminConfig';
import { APP_NAME } from '../config/app';
import './AdminLogin.css';

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!isAdminEmail(email)) {
            setError('Access denied. Only authorized admin accounts can sign in here.');
            setIsLoading(false);
            return;
        }

        try {
            await login(email, password);
            navigate('/admin');
        } catch (err: any) {
            let errorMessage = 'Failed to sign in. Please check your credentials.';

            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else if (err.code) {
                errorMessage = `Authentication error: ${err.code}`;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page page--center">
            <div className="shell shell--sm">
                <div className="card">
                    <p className="brand">{APP_NAME}</p>
                    <h1 className="page-title">Admin</h1>
                    <p className="page-subtitle">Sign in to scan member QR codes.</p>

                    <form onSubmit={handleSubmit} className="form">
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                autoComplete="username"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="alert alert--error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn--primary btn--block"
                        >
                            {isLoading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
