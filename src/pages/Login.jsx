import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import './Login.css';

export default function Login({ initialMode = 'login' }) {
    const normalizedInitialMode = initialMode === 'signup' ? 'signup' : 'login';
    const [mode, setMode] = useState(normalizedInitialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);

            if (mode === 'signup') {
                await signup(email, password, name);
            } else {
                await login(email, password);
            }

            navigate('/');
        } catch (err) {
            setError(err.message || err.error || (mode === 'signup' ? 'Failed to create account' : 'Failed to log in'));
        }

        setLoading(false);
    }

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError('');
    };

    return (
        <div className="login-page">
            <div className="login-orb login-orb-one" aria-hidden="true" />
            <div className="login-orb login-orb-two" aria-hidden="true" />
            <div className="login-grid-overlay" aria-hidden="true" />

            <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="login-shell"
            >
                <aside className="login-showcase">
                    <div className="login-pill">
                        <Sparkles size={14} />
                        <span>ISL Intelligent Workspace</span>
                    </div>

                    <h1>Transform hand gestures into natural speech instantly.</h1>
                    <p>
                        Empowering non-verbal users to communicate confidently in real-time meetings using AI-powered sign recognition and speech synthesis.
                    </p>

                    <div className="login-feature-list">
                        <div className="login-feature-item">
                            <Camera size={16} />
                            <span>Real-time camera gesture pipeline</span>
                        </div>
                        <div className="login-feature-item">
                            <ShieldCheck size={16} />
                            <span>Private account and local model persistence</span>
                        </div>
                    </div>
                </aside>

                <section className="login-card glass-panel">
                    <div className="login-header">
                        <h2>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
                        <p>
                            {mode === 'signup'
                                ? 'Create your account to start translating gestures.'
                                : 'Sign in to continue building and translating.'}
                        </p>
                    </div>

                    <div className="login-mode-toggle" role="tablist" aria-label="Authentication mode">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'login'}
                            className={mode === 'login' ? 'active' : ''}
                            onClick={() => switchMode('login')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'signup'}
                            className={mode === 'signup' ? 'active' : ''}
                            onClick={() => switchMode('signup')}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        {mode === 'signup' && (
                            <div className="login-field">
                                <label htmlFor="signup-name">Full Name</label>
                                <div className="login-input-wrap">
                                    <Sparkles size={16} />
                                    <input
                                        id="signup-name"
                                        type="text"
                                        required={mode === 'signup'}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="login-field">
                            <label htmlFor="login-email">Email</label>
                            <div className="login-input-wrap">
                                <Mail size={16} />
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <div className="login-field">
                            <label htmlFor="login-password">Password</label>
                            <div className="login-input-wrap">
                                <Lock size={16} />
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary login-submit"
                        >
                            {loading
                                ? mode === 'signup' ? 'Creating Account...' : 'Signing In...'
                                : <>{mode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="login-footer">
                        <span>{mode === 'signup' ? 'Already have an account?' : 'Do not have an account?'}</span>
                        <button
                            type="button"
                            className="login-switch-link"
                            onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
                        >
                            {mode === 'signup' ? 'Sign in here' : 'Create one now'}
                        </button>
                    </div>
                </section>
            </motion.div>
        </div>
    );
}
