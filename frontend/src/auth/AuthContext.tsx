import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (email: string, fullName?: string, idToken?: string, targetRole?: string) => Promise<AuthResponse>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  complete2FALogin: (authResponse: AuthResponse) => void;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('veridex_token') || localStorage.getItem('trustguard_token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to restore session:', err);
        try {
          localStorage.removeItem('veridex_token');
          localStorage.removeItem('trustguard_token');
        } catch {}
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const complete2FALogin = (data: AuthResponse) => {
    if (data.access_token && data.user) {
      try {
        localStorage.setItem('veridex_token', data.access_token);
      } catch {}
      setToken(data.access_token);
      setUser(data.user);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const data = await authApi.login(email, password);
    if (!data.requires_2fa && data.access_token && data.user) {
      try {
        localStorage.setItem('veridex_token', data.access_token);
      } catch {}
      setToken(data.access_token);
      setUser(data.user);
    }
    return data;
  };

  const loginWithGoogle = async (email: string, fullName?: string, idToken?: string, targetRole?: string): Promise<AuthResponse> => {
    const data = await authApi.googleAuth(email, fullName, idToken, targetRole);
    if (!data.requires_2fa && data.access_token && data.user) {
      try {
        localStorage.setItem('veridex_token', data.access_token);
      } catch {}
      setToken(data.access_token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (email: string, fullName: string, password: string) => {
    const data = await authApi.register(email, fullName, password);
    if (data.access_token && data.user) {
      try {
        localStorage.setItem('veridex_token', data.access_token);
      } catch {}
      setToken(data.access_token);
      setUser(data.user);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const logout = () => {
    try {
      localStorage.removeItem('veridex_token');
      localStorage.removeItem('trustguard_token');
    } catch {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        complete2FALogin,
        updateUser,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
