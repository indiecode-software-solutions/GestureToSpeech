import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for saved user in localStorage on mount (simple persistence)
        try {
            const savedUser = localStorage.getItem('isl-user');
            if (savedUser) {
                setCurrentUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.warn('Invalid saved user in localStorage. Clearing stale auth state.', error);
            localStorage.removeItem('isl-user');
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    async function signup(email, password, name) {
        try {
            const response = await axios.post('/api/register', { email, password, name });
            const user = response.data.user;
            setCurrentUser(user);
            localStorage.setItem('isl-user', JSON.stringify(user));
            return user;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }

    async function login(email, password) {
        try {
            const response = await axios.post('/api/login', { email, password });
            const user = response.data.user;
            setCurrentUser(user);
            localStorage.setItem('isl-user', JSON.stringify(user));
            return user;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }

    function logout() {
        setCurrentUser(null);
        localStorage.removeItem('isl-user');
        // Also clear models from memory if needed, handled by dashboard unmount
    }

    const value = {
        currentUser,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
