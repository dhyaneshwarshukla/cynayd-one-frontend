"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "../contexts/AuthContext";

function AuthProviderWithNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLoginSuccess = () => {
    console.log('=== PROVIDER - HANDLE LOGIN SUCCESS ===');
    console.log('Provider - handleLoginSuccess called');
    console.log('Provider - Redirecting to dashboard after successful authentication');
    router.push('/dashboard');
  };

  const handleRegisterSuccess = () => {
    router.push('/dashboard');
  };

  const handleLogoutSuccess = () => {
    router.push('/auth/login');
  };

  return (
    <AuthProvider
      onLoginSuccess={handleLoginSuccess}
      onRegisterSuccess={handleRegisterSuccess}
      onLogoutSuccess={handleLogoutSuccess}
    >
      {children}
    </AuthProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProviderWithNavigation>
      {children}
    </AuthProviderWithNavigation>
  );
} 
