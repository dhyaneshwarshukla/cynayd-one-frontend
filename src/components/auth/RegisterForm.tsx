"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../lib/api-client';
import { apiClient, Plan } from '../../lib/api-client';
import { RegisterResultModal } from './RegisterResultModal';
import { formatApiErrorMessage } from '../../utils/api-error';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  organizationSlug: z.string()
    .min(2, 'Organization slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Organization slug can only contain lowercase letters, numbers, and hyphens'),
  organizationType: z.string().min(1, 'Please select organization type'),
  organizationSize: z.string().min(1, 'Please select organization size'),
  industry: z.string().min(1, 'Please select industry'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

type ResultModalState = {
  variant: 'success' | 'error';
  title: string;
  message: string;
  email?: string;
  requiresVerification?: boolean;
};

export const RegisterForm: React.FC = () => {
  const [resultModal, setResultModal] = useState<ResultModalState | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const showError = (message: string, title = 'Registration failed') => {
    setResultModal({ variant: 'error', title, message });
  };

  const showSuccess = (
    message: string,
    options?: { email?: string; requiresVerification?: boolean }
  ) => {
    setResultModal({
      variant: 'success',
      title: options?.requiresVerification ? 'Registration successful' : 'Account created',
      message,
      email: options?.email,
      requiresVerification: options?.requiresVerification,
    });
  };

  const closeResultModal = () => setResultModal(null);

  const handleRegisterAnother = () => {
    closeResultModal();
    reset();
    const freePlan = plans.find((p) => p.slug === 'free');
    if (freePlan) setSelectedPlan(freePlan.id);
  };

  useEffect(() => {
    fetchPlans();
    loadRazorpay();
  }, []);

  const loadRazorpay = () => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      showError('Failed to load payment gateway. Please refresh the page and try again.');
    };
    document.body.appendChild(script);
  };

  const fetchPlans = async () => {
    try {
      const activePlans = await apiClient.getPlans(true);
      const plansArray = Array.isArray(activePlans) ? activePlans : [];
      setPlans(plansArray);
      // Auto-select free plan
      const freePlan = plansArray.find(p => p.slug === 'free');
      if (freePlan) setSelectedPlan(freePlan.id);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const getPriceForPlan = (plan: Plan) => {
    if (!plan.pricings || plan.pricings.length === 0) return null;
    const pricing = plan.pricings.find(p => p.billingPeriod === selectedBillingPeriod);
    return pricing;
  };

  const formatPrice = (price: string, currency: string = 'INR') => {
    const numPrice = Number(price);
    if (numPrice === 0) return 'Free';
    
    if (currency === 'INR') {
      return `₹${Math.round(numPrice).toLocaleString('en-IN')}`;
    }
    return `$${numPrice.toLocaleString()}`;
  };

  const completeRegistration = async (data: RegisterFormData, paymentData?: {
    paymentOrderId: string;
    paymentId: string;
    paymentSignature: string;
    pricingId: string;
  }) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    try {
      setIsRegistering(true);

      const registerData: RegisterData = {
        email: normalizedEmail,
        password: data.password,
        name: data.name,
        organizationName: data.organizationName,
        organizationSlug: data.organizationSlug,
        organizationType: data.organizationType,
        organizationSize: data.organizationSize,
        industry: data.industry,
        phoneNumber: data.phoneNumber,
        jobTitle: data.jobTitle,
        planId: selectedPlan || undefined,
        pricingId: paymentData?.pricingId,
        paymentOrderId: paymentData?.paymentOrderId,
        paymentId: paymentData?.paymentId,
        paymentSignature: paymentData?.paymentSignature,
      };

      const result = await registerUser(registerData);

      if (result.requiresVerification) {
        showSuccess(
          result.message ||
            'We sent a verification link to your email. Please verify your account before signing in.',
          { email: normalizedEmail, requiresVerification: true }
        );
      } else {
        showSuccess('Your account is ready. You can sign in now.', {
          email: normalizedEmail,
          requiresVerification: false,
        });
      }
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to complete registration. Please try again.'));
    } finally {
      setIsRegistering(false);
      setProcessingPayment(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (!selectedPlan) {
        showError('Please select a plan to continue.', 'Plan required');
        return;
      }

      const selectedPlanObj = plans.find(p => p.id === selectedPlan);
      const pricing = selectedPlanObj ? getPriceForPlan(selectedPlanObj) : null;
      const isPaidPlan = pricing && Number(pricing.price) > 0;

      // If free plan, register directly
      if (!isPaidPlan || !pricing) {
        await completeRegistration(data);
        return;
      }

      // For paid plans, process payment first
      if (!razorpayLoaded) {
        showError('Payment gateway is still loading. Please wait a moment and try again.');
        return;
      }

      setProcessingPayment(true);

      // Normalize email: trim and convert to lowercase for payment order
      const normalizedEmail = data.email.trim().toLowerCase();
      
      // Create payment order with user email for reconciliation
      const orderResponse = await apiClient.createPaymentOrder({
        planId: selectedPlan,
        pricingId: pricing.id,
        currency: pricing.currency || 'INR',
        notes: {
          organizationName: data.organizationName || '',
          email: normalizedEmail,
          userEmail: normalizedEmail, // Explicitly pass for reconciliation
        },
      });

      if (!orderResponse.success || !orderResponse.order) {
        throw new Error('Failed to create payment order');
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'CYNAYD One',
        description: `${selectedPlanObj?.name} Plan`,
        order_id: orderResponse.order.id,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await apiClient.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifyResponse.success) {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }

            // Complete registration with payment details
            await completeRegistration(data, {
              paymentOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              paymentSignature: response.razorpay_signature,
              pricingId: pricing.id,
            });
          } catch (err) {
            showError(formatApiErrorMessage(err, 'Payment verification failed. Please try again.'));
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: data.name,
          email: normalizedEmail,
          contact: data.phoneNumber || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', (response: any) => {
        showError(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setProcessingPayment(false);
      });
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to process registration. Please try again.'));
      setProcessingPayment(false);
    }
  };

  const isSubmitting = isRegistering || processingPayment;

  return (
    <Card className="w-full max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Organization Account</h2>
        <p className="text-gray-600">Join the complete business ecosystem with CYNAYD One</p>
        <div className="mt-4 flex justify-center items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Free 30-day trial
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Setup in minutes
          </div>
        </div>
      </div>
      
      <RegisterResultModal
        isOpen={resultModal !== null}
        variant={resultModal?.variant ?? 'success'}
        title={resultModal?.title ?? ''}
        message={resultModal?.message ?? ''}
        email={resultModal?.email}
        requiresVerification={resultModal?.requiresVerification}
        onClose={closeResultModal}
        onRegisterAnother={
          resultModal?.variant === 'success' ? handleRegisterAnother : undefined
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        className="space-y-8"
      >
        {/* Personal Information Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            Personal Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Full Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Enter your full name"
            />
            <Input
              type="email"
              label="Email Address"
              {...register('email')}
              error={errors.email?.message}
              placeholder="Enter your email address"
            />
            <Input
              type="text"
              label="Job Title"
              {...register('jobTitle')}
              error={errors.jobTitle?.message}
              placeholder="e.g., CEO, IT Director, Manager"
            />
            <Input
              type="tel"
              label="Phone Number"
              {...register('phoneNumber')}
              error={errors.phoneNumber?.message}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {/* Organization Information Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            Organization Details
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Organization Name"
              {...register('organizationName')}
              error={errors.organizationName?.message}
              placeholder="Enter your organization name"
            />
            <Input
              type="text"
              label="Organization Slug"
              {...register('organizationSlug')}
              error={errors.organizationSlug?.message}
              placeholder="your-company (used in URLs)"
              helperText="This will be used in your organization's URL: cynayd.com/your-company"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type
              </label>
              <select
                {...register('organizationType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="corporation">Corporation</option>
                <option value="llc">LLC</option>
                <option value="partnership">Partnership</option>
                <option value="nonprofit">Non-profit</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
              {errors.organizationType && (
                <p className="mt-1 text-sm text-red-600">{errors.organizationType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Size
              </label>
              <select
                {...register('organizationSize')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
              {errors.organizationSize && (
                <p className="mt-1 text-sm text-red-600">{errors.organizationSize.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                {...register('industry')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
                <option value="consulting">Consulting</option>
                <option value="government">Government</option>
                <option value="nonprofit">Non-profit</option>
                <option value="other">Other</option>
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Plan Selection Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Choose Your Plan
          </h3>

          {loadingPlans ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <>
              {/* Billing Period Toggle */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSelectedBillingPeriod('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedBillingPeriod === 'monthly'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBillingPeriod('yearly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedBillingPeriod === 'yearly'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Yearly <span className="text-xs">(Save 20%)</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const pricing = getPriceForPlan(plan);
                  const isSelected = selectedPlan === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      {plan.isDefault && (
                        <div className="inline-block px-2 py-1 mb-2 bg-green-100 text-green-800 text-xs font-bold rounded">
                          POPULAR
                        </div>
                      )}
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h4>
                      <div className="text-3xl font-extrabold text-gray-900 mb-1">
                        {pricing ? formatPrice(pricing.price, pricing.currency || 'INR') : 'Contact Us'}
                      </div>
                      {pricing && (
                        <div className="text-sm text-gray-600 mb-4">
                          per {selectedBillingPeriod === 'monthly' ? 'month' : selectedBillingPeriod === 'yearly' ? 'year' : 'quarter'}
                        </div>
                      )}
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                      )}
                      <div className="space-y-2">
                        {plan.maxUsers && (
                          <div className="text-xs text-gray-600">
                            ✓ Up to {plan.maxUsers} users
                          </div>
                        )}
                        {plan.maxApps && (
                          <div className="text-xs text-gray-600">
                            ✓ {plan.maxApps} apps
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!selectedPlan && (
                <p className="text-red-600 text-sm mt-4 text-center">
                  Please select a plan to continue
                </p>
              )}
            </>
          )}
        </div>

        {/* Security Section */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            Account Security
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              type="password"
              label="Password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="Create a strong password"
              helperText="Must contain uppercase, lowercase, number, and special character"
            />
            <Input
              type="password"
              label="Confirm Password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your password"
            />
          </div>
        </div>

        {/* Terms and Submit */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
          <div className="flex items-start space-x-3 mb-6">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 font-medium">
                Terms of Service
              </a>
              ,{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 font-medium">
                Privacy Policy
              </a>
              , and{' '}
              <a href="/acceptable-use" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 font-medium">
                Acceptable Use Policy
              </a>
              . I acknowledge the{' '}
              <a href="/dpa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 font-medium">
                Data Processing Agreement
              </a>{' '}
              applies to organization data and the{' '}
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 font-medium">
                Cookie Policy
              </a>{' '}
              describes how we use cookies.
            </label>
          </div>

          <div className="bg-white rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your organization account will be created instantly</li>
              <li>• You'll receive a verification email to activate your account</li>
              <li>• Access all CYNAYD One apps and features immediately</li>
              <li>• Start with a 30-day free trial, no credit card required</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {processingPayment ? 'Processing Payment...' : 'Creating Your Organization...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Organization Account
              </div>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 