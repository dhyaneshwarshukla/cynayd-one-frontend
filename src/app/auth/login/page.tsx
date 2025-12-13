"use client";

import { LoginForm } from '@/components/auth/LoginForm';
import { Shield, Lock, Users, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Login | CYNAYD One';
  }, []);

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden enterprise-login-bg">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl floating-element"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl floating-element"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl floating-element"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white slide-in-left">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 glass-morphism glow-effect">
                <Shield className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold">CYNAYD</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Enterprise Security
              <span className="block text-blue-200">Made Simple</span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Secure, scalable, and intelligent authentication platform designed for modern enterprises.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center fade-in-up">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 glass-morphism">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-lg">Advanced Security Protocols</span>
              </div>
              <div className="flex items-center fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 glass-morphism">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-lg">Enterprise User Management</span>
              </div>
              <div className="flex items-center fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 glass-morphism">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-lg">Lightning Fast Performance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8 mobile-logo">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 glow-effect">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">CYNAYD</h1>
            </div>
          </div>

          <div className="text-center mb-8 slide-in-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your enterprise account
            </p>
          </div>

          <div className="fade-in-up">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
