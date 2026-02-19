import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/app';
import axios from '@/api/axios';

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

  const normalizeUser = (raw: any, existing?: User | null): User => ({
    ...(existing || {}),
    ...(raw || {}),
    fullName: raw?.fullName || raw?.name || existing?.fullName || '',
    name: raw?.name || raw?.fullName || existing?.name || existing?.fullName || '',
    avatar:
      raw?.avatar ||
      raw?.profileImage ||
      raw?.profilePicture ||
      existing?.avatar ||
      null,
  });

  const hydrateAvatarIfMissing = async (baseUser: User) => {
    if (!baseUser || baseUser.avatar) return;
    try {
      const profile = await axios.get('/userprofile');
      const profileImage = profile.data?.profileImage || null;
      if (!profileImage) return;

      setUser((prev) => {
        const merged = normalizeUser(
          {
            ...(prev || baseUser),
            avatar: profileImage,
          },
          prev || baseUser,
        );
        localStorage.setItem('user', JSON.stringify(merged));
        return merged;
      });
    } catch {
      // Profile document may not exist yet for some users.
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalized = normalizeUser(parsed);
        setUser(normalized);
        setToken(storedToken);
        void hydrateAvatarIfMissing(normalized);
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
    setUser((prev) => {
      const normalized = normalizeUser(userData, prev);
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    });
    void hydrateAvatarIfMissing(normalizeUser(userData, user));
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
