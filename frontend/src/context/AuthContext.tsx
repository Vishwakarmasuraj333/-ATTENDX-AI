import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getAuthToken, setAuthToken, removeAuthToken, apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('attendx_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getAuthToken();
      if (savedToken) {
        try {
          const profile = await apiRequest<{
            id: number;
            email: string;
            full_name: string;
            role_name: UserRole;
            role_id: number;
            avatar_url?: string;
          }>('/auth/me');
          
          const fullUser: User = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role_name,
            role_id: profile.role_id,
            avatar_url: profile.avatar_url,
          };
          setUser(fullUser);
          localStorage.setItem('attendx_user', JSON.stringify(fullUser));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, userData: User) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('attendx_user', JSON.stringify(userData));
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    localStorage.removeItem('attendx_user');
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

