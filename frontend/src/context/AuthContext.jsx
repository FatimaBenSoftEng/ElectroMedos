import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((userData) => {
    setUser(userData);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
    else localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getProfile()
      .then(({ data }) => persistUser(data))
      .catch(() => authService.logout())
      .finally(() => setLoading(false));
  }, [persistUser]);

  const login = async (username, password) => {
    const { data } = await authService.login(username, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    persistUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await authService.register(formData);
    return data;
  };

  const logout = () => {
    authService.logout();
    persistUser(null);
  };

  const updateProfile = async (formData) => {
    const { data } = await authService.updateProfile(formData);
    persistUser(data);
    return data;
  };

  const changePassword = async (formData) => {
    const { data } = await authService.changePassword(formData);
    return data;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: !!user?.is_staff,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
