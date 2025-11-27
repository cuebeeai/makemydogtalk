import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  credits?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void; // Google OAuth login
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/me', {
        credentials: 'include', // Important: send cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } else {
        console.log('Auth check returned non-OK status:', response.status);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is logged in on mount and handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    const isOAuthCallback = authStatus === 'success';
    const isOAuthError = authStatus === 'error';

    if (isOAuthCallback) {
      console.log('OAuth callback detected, checking auth...');
      // Remove the query parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Add a small delay to ensure cookie is set
      setTimeout(() => {
        checkAuth();
      }, 100);
    } else if (isOAuthError) {
      const errorMessage = params.get('message') || 'Authentication failed';
      console.error('OAuth error:', errorMessage);
      alert(`Login failed: ${errorMessage}`);
      // Remove the query parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      setIsLoading(false);
    } else {
      // Normal auth check
      checkAuth();
    }
  }, []);

  const login = () => {
    // Start OAuth flow (Google)
    window.location.href = '/auth/google';
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithEmail, signup, logout, refreshUser }}>
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
