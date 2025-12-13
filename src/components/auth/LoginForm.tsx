"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Alert } from '../common/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../lib/api-client';
import { MFAVerificationModal } from './MFAVerificationModal';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [showUnlockOption, setShowUnlockOption] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaData, setMfaData] = useState<{userId: string, email: string, password: string} | null>(null);
  const { login, isLoading, resendVerification, setUserDirectly, triggerLoginSuccess } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData, e?: React.BaseSyntheticEvent) => {
    // Explicitly prevent default form submission
    if (e) {
      e.preventDefault();
    }
    
    try {
      setError(null);
      setResendMessage(null);
      setShowResendOption(false);
      setIsSubmitting(true);
      
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      };
      
      await login(credentials);
    } catch (err: any) {
      console.log('Login error:', err);
      console.log('Error response:', err.response?.data);
      
      // Extract error message from response data first, then fallback to error message
      const errorMessage = err.response?.data?.message || (err instanceof Error ? err.message : 'Failed to login');
      
      // Check if it's an MFA required error
      if (err.response?.data?.code === 'MFA_REQUIRED') {
        console.log('MFA required, showing modal');
        setMfaData({
          userId: err.response.data.userId,
          email: err.response.data.email,
          password: data.password,
        });
        setShowMFA(true);
        return;
      }
      
      // Check if it's an account locked error FIRST (before setting generic error)
      if (err.response?.data?.code === 'ACCOUNT_LOCKED' || errorMessage.toLowerCase().includes('account is locked') || errorMessage.toLowerCase().includes('locked until')) {
        const lockedUntil = err.response?.data?.lockedUntil;
        const userEmail = err.response?.data?.userEmail || data.email;
        const lockMessage = lockedUntil 
          ? `Account is locked until ${new Date(lockedUntil).toLocaleString()}.`
          : errorMessage.includes('locked') ? errorMessage : 'Account is locked.';
        setError(lockMessage);
        // Always show unlock option if account is locked
        setShowUnlockOption(true);
        setUserEmail(userEmail);
        console.log('Account locked - showing unlock option', { 
          code: err.response?.data?.code, 
          userEmail,
          errorMessage,
          responseData: err.response?.data 
        });
        return;
      }
      
      setError(errorMessage);

      // Check if it's an invalid credentials error with attempt count
      if (err.response?.data?.code === 'INVALID_CREDENTIALS') {
        const attemptsRemaining = err.response.data.attemptsRemaining;
        const errorMsg = err.response.data.message || errorMessage;
        setError(errorMsg);
        // Show warning if attempts are low
        if (attemptsRemaining <= 3 && attemptsRemaining > 0) {
          console.warn(`⚠️ Only ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before account lock`);
        }
        return;
      }

      // Check if it's an email verification error
      if (errorMessage.includes('verify your email') || errorMessage.includes('EMAIL_NOT_VERIFIED')) {
        setShowResendOption(true);
        setUserEmail(data.email);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setResendMessage(null);
      await resendVerification(userEmail);
      setResendMessage('Verification email sent successfully! Please check your inbox.');
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleRequestUnlockEmail = async () => {
    try {
      setIsRequestingUnlock(true);
      setUnlockMessage(null);
      const apiClient = (await import('../../lib/api-client')).apiClient;
      await apiClient.requestUnlockEmail(userEmail);
      setUnlockMessage('Unlock email sent successfully! Please check your inbox and click the unlock link.');
      setShowUnlockOption(false);
    } catch (err) {
      setUnlockMessage(err instanceof Error ? err.message : 'Failed to send unlock email');
    } finally {
      setIsRequestingUnlock(false);
    }
  };

  const handleMFASuccess = async (accessToken: string, refreshToken: string, user: any) => {
    console.log('=== MFA SUCCESS HANDLER CALLED ===');
    console.log('MFA Success - Starting...', { accessToken: !!accessToken, refreshToken: !!refreshToken, user });
    
    try {
      // Store tokens
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      console.log('MFA Success - Tokens stored');
      
      // Update AuthContext with user data
      setUserDirectly(user);
      console.log('MFA Success - User set in AuthContext');
      
      // Close MFA modal
      setShowMFA(false);
      setMfaData(null);
      console.log('MFA Success - Modal closed');
      
      // Trigger login success callback to handle navigation
      triggerLoginSuccess();
      console.log('MFA Success - Login success callback triggered');
      
      // Navigate to dashboard
      router.push('/dashboard');
      console.log('MFA Success - Redirected to dashboard');
      
    } catch (error) {
      console.error('Error completing MFA login:', error);
      // Show error instead of reloading
      setError('Failed to complete MFA login. Please try again.');
    }
  };

  const handleMFAClose = () => {
    setShowMFA(false);
    setMfaData(null);
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        {/* Security Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full security-badge">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Secure Connection</span>
          </div>
        </div>
        
        {error && (
          <Alert variant="error" className="mb-6 border-red-200 bg-red-50">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              {error}
            </div>
          </Alert>
        )}

        {showResendOption && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Email Verification Required
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Please verify your email address before logging in. Check your inbox for the verification email.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnlockOption && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800 mb-2">
                  Account Locked
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  Your account has been locked. Click the button below to receive an unlock link via email.
                </p>
                <button
                  type="button"
                  onClick={handleRequestUnlockEmail}
                  disabled={isRequestingUnlock}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRequestingUnlock ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-orange-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Unlock Email
                    </>
                  )}
                </button>
                {unlockMessage && (
                  <p className={`text-sm mt-2 ${unlockMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {unlockMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {resendMessage && (
          <Alert variant={resendMessage.includes('successfully') ? 'success' : 'error'} className="mb-6">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${resendMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {resendMessage}
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent enterprise-input placeholder:text-gray-500 text-gray-900 ${
                  errors.email 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                } ${isFormLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ color: '#111827 !important' }}
                placeholder="Enter your email address"
                disabled={isFormLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent enterprise-input placeholder:text-gray-500 text-gray-900 ${
                  errors.password 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                } ${isFormLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ color: '#111827 !important' }}
                placeholder="Enter your password"
                disabled={isFormLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isFormLoading}
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-lg enterprise-button"
            disabled={isFormLoading}
            loading={isFormLoading}
          >
            {isFormLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Sign in to your account
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
        </div>


        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/auth/register"
              className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
            >
              Create one now
            </a>
          </p>
        </div>
      </Card>

      {/* MFA Verification Modal */}
      {showMFA && mfaData && (
        <MFAVerificationModal
          isOpen={showMFA}
          onClose={handleMFAClose}
          onSuccess={handleMFASuccess}
          userId={mfaData.userId}
          email={mfaData.email}
          password={mfaData.password}
        />
      )}
    </div>
  );
}; 