"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiClient, { User, LoginCredentials, RegisterData } from '../lib/api-client';
import { clearSessionLocked, touchUserInteraction } from '../lib/session-lock-storage';

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<{ message: string }>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  logoutCurrentDevice: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserDirectly: (user: User) => void;
  triggerLoginSuccess: () => void;
  mustEnrollMfa: boolean;
  clearMustEnrollMfa: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onLogoutSuccess?: () => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  onLoginSuccess,
  onRegisterSuccess,
  onLogoutSuccess
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustEnrollMfa, setMustEnrollMfa] = useState(false);

  const syncMustEnrollMfa = () => {
    setMustEnrollMfa(apiClient.getMustEnrollMfa());
  };

  const clearMustEnrollMfa = () => {
    apiClient.clearMustEnrollMfa();
    setMustEnrollMfa(false);
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      // Set a timeout to ensure loading never hangs forever
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('AuthContext - Initialization timeout, stopping loading state');
          setIsLoading(false);
        }
      }, 5000); // 5 second timeout

      try {
        // Try to get user data - this will work with both localStorage tokens and cookies
        try {
          const userData = await apiClient.getCurrentUser();
          if (isMounted) {
            clearTimeout(timeoutId);
            setUser(userData);
            syncMustEnrollMfa();
            setIsLoading(false);
          }
        } catch (error: any) {
          // Only logout if we have a token but it's invalid
          if (apiClient.getAuthToken()) {
            apiClient.logout();
          }
          if (isMounted) {
            clearTimeout(timeoutId);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.warn('AuthContext - Failed to initialize auth:', error);
        // Clear invalid token
        apiClient.logout();
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    apiClient.onSessionInvalidated(() => {
      setUser(null);
      clearMustEnrollMfa();
      onLogoutSuccess?.();
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      apiClient.onSessionInvalidated(null);
    };
  }, [onLogoutSuccess]);

  // Detect remote session revocation while the tab stays open
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      void apiClient.getCurrentUser().catch(() => {
        // Session invalidation is handled globally in api-client
      });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user?.id]);

  // Refresh user data
  const refreshUser = async () => {
    try {
      console.log('AuthContext - Calling getCurrentUser...');
      const userData = await apiClient.getCurrentUser();
      console.log('AuthContext - User data received:', userData);
      setUser(userData);
    } catch (error) {
      console.error('AuthContext - Failed to refresh user:', error);
      setUser(null);
      throw error;
    }
  };

  // Set user directly (for MFA flow)
  const setUserDirectly = (userData: User) => {
    setUser(userData);
  };

  // Trigger login success callback (for MFA flow)
  const triggerLoginSuccess = () => {
    clearSessionLocked();
    touchUserInteraction();
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(credentials);

      if (response.mustEnrollMfa) {
        setMustEnrollMfa(true);
      } else {
        clearMustEnrollMfa();
      }

      const fullUser = await apiClient.getCurrentUser();
      setUser(fullUser);

      clearSessionLocked();
      touchUserInteraction();

      onLoginSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function — do not toggle global isLoading (avoids SessionLockProvider unmounting auth pages)
  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.register(data);

      if (response.requiresVerification) {
        return {
          requiresVerification: true,
          message: response.message || 'Please check your email to verify your account.',
        };
      }

      const fullUser = await apiClient.getCurrentUser();
      setUser(fullUser);
      onRegisterSuccess?.();

      return {
        requiresVerification: false,
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Email verification function
  const verifyEmail = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.verifyEmail(token);
      
      // Fetch full user profile to get all required fields
      const fullUser = await apiClient.getCurrentUser();
      setUser(fullUser);
      
      // Call success callback if provided
      onRegisterSuccess?.();
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email function
  const resendVerification = async (email: string) => {
    try {
      return await apiClient.resendVerification(email);
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (data: any) => {
    try {
      setIsLoading(true);
      await apiClient.updateProfile(data);
      // Refresh user data after update
      await refreshUser();
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const performLogout = async (logoutFn: () => Promise<void>) => {
    try {
      setIsLoading(true);
      await logoutFn();
      setUser(null);
      clearMustEnrollMfa();
      onLogoutSuccess?.();
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      onLogoutSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  const logoutCurrentDevice = async () => {
    await performLogout(() => apiClient.logout());
  };

  const logoutEverywhere = async () => {
    await performLogout(() => apiClient.logoutAll());
  };

  const logout = logoutCurrentDevice;

  const value: AuthContextType = {
    user,
    session: user ? { user } : null,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    resendVerification,
    updateProfile,
    logout,
    logoutCurrentDevice,
    logoutEverywhere,
    refreshUser,
    setUserDirectly,
    triggerLoginSuccess,
    mustEnrollMfa,
    clearMustEnrollMfa,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
