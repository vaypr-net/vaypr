import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/app';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clean up old localStorage keys from previous fake auth system
function cleanupOldLocalStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fintrack_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        // Normalize avatar/name fields from multiple possible backend shapes
        const normalized = {
          ...parsed,
          fullName: parsed.fullName || parsed.name || parsed.fullName,
          name: parsed.name || parsed.fullName || parsed.name,
          avatar: parsed.avatar || parsed.profileImage || parsed.profilePicture || null,
        };
        setUser(normalized);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    cleanupOldLocalStorage();
    setUser(null);
    setToken(null);
    // Don't redirect here - let the component handle navigation
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
