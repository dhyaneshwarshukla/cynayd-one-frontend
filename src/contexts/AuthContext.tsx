"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiClient, { User, LoginCredentials, RegisterData } from '../lib/api-client';

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
  refreshUser: () => Promise<void>;
  setUserDirectly: (user: User) => void;
  triggerLoginSuccess: () => void;
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

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

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
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(credentials);
      
      // Fetch full user profile to get all required fields
      const fullUser = await apiClient.getCurrentUser();
      setUser(fullUser);
      
      // Call success callback if provided
      onLoginSuccess?.();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(data);
      
      if (response.requiresVerification) {
        // Don't set user or call success callback for email verification flow
        return {
          requiresVerification: true,
          message: response.message || 'Please check your email to verify your account.'
        };
      }
      
      // Fetch full user profile to get all required fields
      const fullUser = await apiClient.getCurrentUser();
      setUser(fullUser);
      
      // Call success callback if provided
      onRegisterSuccess?.();
      
      return {
        requiresVerification: false,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      const response = await apiClient.resendVerification(email);
      return response;
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
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

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiClient.logout();
      setUser(null);
      
      // Call success callback if provided
      onLogoutSuccess?.();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout request fails, clear local state
      setUser(null);
      onLogoutSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

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
    refreshUser,
    setUserDirectly,
    triggerLoginSuccess,
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
