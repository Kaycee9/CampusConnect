import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useToast } from '../components/ui/Toast.jsx';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadUser = useCallback(async () => {
    try {
      // If we have an accessToken in memory or a valid refresh cookie, /me will resolve
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      setUser(data.user);
      toast.success('Successfully logged in');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      setUser(data.user);
      toast.success('Account created successfully');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error;
      // Handle Zod validation arrays nicely if they appear
      if (error.response?.data?.details) {
        toast.error(error.response.data.details[0].message);
      } else {
        toast.error(msg || 'Registration failed');
      }
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      toast.info('Logged out successfully');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
