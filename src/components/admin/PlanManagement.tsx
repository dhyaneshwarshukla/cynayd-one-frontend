"use client";

import { useState, useEffect } from 'react';
import { apiClient, Plan, Pricing, Organization } from '@/lib/api-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PlanManagementProps {
  organizationId: string;
}

export default function PlanManagement({ organizationId }: PlanManagementProps) {
  const { user } = useAuth();
  const [toasts, toastActions] = useToast();
  const [currentPlan, setCurrentPlan] = useState<Organization | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadRazorpay();
    fetchPlanData();
  }, [organizationId]);

  const loadRazorpay = () => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError('Failed to load payment gateway');
    document.body.appendChild(script);
  };

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current organization plan details
      const planDetails = await apiClient.getOrganizationPlanDetails(organizationId);
      setCurrentPlan(planDetails);

      // Fetch all available plans
      const plans = await apiClient.getPlans(true);
      setAvailablePlans(Array.isArray(plans) ? plans : []);
    } catch (err) {
      console.error('Error fetching plan data:', err);
      setError('Failed to load plan information');
    } finally {
      setLoading(false);
    }
  };

  const getPriceForPlan = (plan: Plan) => {
    if (!plan.pricings || plan.pricings.length === 0) return null;
    return plan.pricings.find(p => p.billingPeriod === selectedBillingPeriod);
  };

  const formatPrice = (price: string | number | null | undefined, currency: string = 'INR') => {
    if (price === null || price === undefined || price === '') return 'Free';
    
    // Handle Decimal objects or string prices
    let priceStr: string;
    if (typeof price === 'object') {
      // At this point, price is guaranteed to be non-null (checked above) and an object
      const priceObj = price as { toString?: () => string };
      priceStr = priceObj && 'toString' in priceObj ? priceObj.toString() : String(price);
    } else {
      priceStr = String(price);
    }
    
    const numPrice = parseFloat(priceStr);
    
    if (isNaN(numPrice)) {
      console.warn('Invalid price value:', price);
      return 'N/A';
    }
    
    if (numPrice === 0) return 'Free';
    
    if (currency === 'INR') {
      return `₹${Math.round(numPrice).toLocaleString('en-IN')}`;
    }
    return `$${Math.round(numPrice).toLocaleString()}`;
  };

  const formatStorage = (storage: string | number | null | undefined): string => {
    if (!storage) return 'Unlimited';
    
    // Handle BigInt strings or numbers
    let storageStr: string;
    if (typeof storage === 'object') {
      const storageObj = storage as { toString?: () => string };
      storageStr = storageObj && 'toString' in storageObj ? storageObj.toString() : String(storage);
    } else {
      storageStr = String(storage);
    }
    
    const bytes = BigInt(storageStr);
    const gb = Number(bytes) / (1024 ** 3);
    
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)}TB`;
    }
    return `${gb.toFixed(0)}GB`;
  };

  // Helper to get plan tier (for comparison)
  const getPlanTier = (plan: Plan): number => {
    // Free plan = 0, Professional = 1, Enterprise = 2
    if (plan.slug === 'free') return 0;
    if (plan.slug === 'professional') return 1;
    if (plan.slug === 'enterprise') return 2;
    
    // Otherwise, compare by price
    const pricing = plan.pricings?.[0];
    if (pricing) {
      return Number(pricing.price);
    }
    return 0;
  };

  const isUpgrade = (plan: Plan): boolean => {
    if (!currentPlan?.plan) return true;
    const current = currentPlan.plan;
    if (current.id === plan.id) return false;
    
    const currentTier = getPlanTier(current);
    const newTier = getPlanTier(plan);
    
    // If tier comparison works, use it
    if (currentTier > 0 && newTier > 0) {
      return newTier > currentTier;
    }
    
    // Otherwise compare by pricing
    const currentPricing = current.pricings?.find(p => p.billingPeriod === selectedBillingPeriod);
    const newPricing = plan.pricings?.find(p => p.billingPeriod === selectedBillingPeriod);
    
    if (currentPricing && newPricing) {
      return Number(newPricing.price) > Number(currentPricing.price);
    }
    
    // If current is free and new is not, it's an upgrade
    if (current.slug === 'free' && plan.slug !== 'free') {
      return true;
    }
    
    return false;
  };

  const isDowngrade = (plan: Plan): boolean => {
    if (!currentPlan?.plan) return false;
    const current = currentPlan.plan;
    if (current.id === plan.id) return false;
    
    const currentTier = getPlanTier(current);
    const newTier = getPlanTier(plan);
    
    // If tier comparison works, use it
    if (currentTier > 0 && newTier > 0) {
      return newTier < currentTier;
    }
    
    // Otherwise compare by pricing
    const currentPricing = current.pricings?.find(p => p.billingPeriod === selectedBillingPeriod);
    const newPricing = plan.pricings?.find(p => p.billingPeriod === selectedBillingPeriod);
    
    if (currentPricing && newPricing) {
      return Number(newPricing.price) < Number(currentPricing.price);
    }
    
    // If current is not free and new is free, it's a downgrade
    if (current.slug !== 'free' && plan.slug === 'free') {
      return true;
    }
    
    return false;
  };

  const handleUpgrade = async (plan: Plan) => {
    try {
      setSelectedUpgradePlan(plan);
      
      const pricing = getPriceForPlan(plan);
      if (!pricing || Number(pricing.price) <= 0) {
        toastActions.showToast({
          type: 'error',
          title: 'Invalid Plan',
          message: 'Please select a valid paid plan to upgrade',
        });
        return;
      }

      if (!razorpayLoaded) {
        setError('Payment gateway is loading. Please wait a moment and try again.');
        return;
      }

      setProcessingPayment(true);

      // Create payment order
      const orderResponse = await apiClient.createPaymentOrder({
        organizationId: organizationId,
        planId: plan.id,
        pricingId: pricing.id,
        currency: pricing.currency || 'INR',
        notes: {
          type: 'plan_upgrade',
          fromPlan: currentPlan?.plan?.name || 'Unknown',
          toPlan: plan.name,
          email: user?.email || '',
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
        description: `Upgrade to ${plan.name} Plan`,
        order_id: orderResponse.order.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await apiClient.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifyResponse.success) {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }

            // Update organization plan
            await apiClient.assignPlanToOrganization(organizationId, plan.id);
            
            // Refresh plan data
            await fetchPlanData();
            
            toastActions.showToast({
              type: 'success',
              title: 'Upgrade Successful!',
              message: `Your organization has been upgraded to ${plan.name} plan.`,
            });
            
            setShowUpgradeModal(false);
            setSelectedUpgradePlan(null);
          } catch (err) {
            toastActions.showToast({
              type: 'error',
              title: 'Upgrade Failed',
              message: err instanceof Error ? err.message : 'Failed to complete upgrade',
            });
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
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
        toastActions.showToast({
          type: 'error',
          title: 'Payment Failed',
          message: response.error.description || 'Payment could not be processed',
        });
        setProcessingPayment(false);
      });
    } catch (err) {
      toastActions.showToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to initiate upgrade',
      });
      setProcessingPayment(false);
    }
  };

  const handleDowngrade = (plan: Plan) => {
    setShowUpgradeModal(true);
    setSelectedUpgradePlan(plan);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Current Plan Section */}
      {currentPlan?.plan && (
        <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <span className="text-2xl text-white">💎</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Current Plan</h3>
                  <p className="text-lg text-gray-700">{currentPlan.plan.name}</p>
                </div>
                {currentPlan.plan.isDefault && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    POPULAR
                  </span>
                )}
              </div>
              
              {currentPlan.plan.description && (
                <p className="text-sm text-gray-700 mb-4">{currentPlan.plan.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {currentPlan.plan.maxUsers !== null && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase">Max Users</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {currentPlan.plan.maxUsers || 'Unlimited'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {currentPlan.userCount || 0}
                    </p>
                  </div>
                )}
                
                {currentPlan.plan.maxApps !== null && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase">Max Apps</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currentPlan.plan.maxApps || 'Unlimited'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {currentPlan.appCount || 0}
                    </p>
                  </div>
                )}
                
                {currentPlan.plan.maxStorage && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 uppercase">Storage</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatStorage(currentPlan.plan.maxStorage)}
                    </p>
                  </div>
                )}
              </div>

              {currentPlan.plan.pricings && currentPlan.plan.pricings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-medium text-gray-600 uppercase mb-2">Current Pricing</p>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.plan.pricings.map((pricing: Pricing) => (
                      <span key={pricing.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {pricing.billingPeriod}: {formatPrice(pricing.price, pricing.currency)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans Section */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Available Plans</h3>
          <p className="text-gray-600">Choose the plan that best fits your organization's needs</p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-gray-100 rounded-lg shadow-sm border border-gray-200">
            <button
              type="button"
              onClick={() => setSelectedBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBillingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
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
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Yearly <span className="text-xs">(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const pricing = getPriceForPlan(plan);
            const isCurrentPlan = currentPlan?.plan?.id === plan.id;
            const upgrade = isUpgrade(plan);
            const downgrade = isDowngrade(plan);

            return (
              <Card
                key={plan.id}
                className={`p-6 border-2 transition-all ${
                  isCurrentPlan
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : upgrade
                    ? 'border-green-300 bg-white hover:border-green-400 hover:shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.isDefault && (
                  <div className="inline-block px-2 py-1 mb-2 bg-green-100 text-green-800 text-xs font-bold rounded">
                    POPULAR
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                  {isCurrentPlan && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                      CURRENT
                    </span>
                  )}
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                )}

                <div className="mb-4">
                  <div className="text-3xl font-extrabold text-gray-900 mb-1">
                    {pricing ? formatPrice(pricing.price, pricing.currency) : 'Contact Us'}
                  </div>
                  {pricing && (
                    <div className="text-sm text-gray-600">
                      per {selectedBillingPeriod === 'monthly' ? 'month' : 'year'}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  {plan.maxUsers !== null && (
                    <div className="text-xs text-gray-600 flex items-center">
                      <span className="mr-2">✓</span>
                      Up to {plan.maxUsers} users
                    </div>
                  )}
                  {plan.maxUsers === null && (
                    <div className="text-xs text-gray-600 flex items-center">
                      <span className="mr-2">✓</span>
                      Unlimited users
                    </div>
                  )}
                  {plan.maxApps !== null && (
                    <div className="text-xs text-gray-600 flex items-center">
                      <span className="mr-2">✓</span>
                      {plan.maxApps} apps
                    </div>
                  )}
                  {plan.maxApps === null && (
                    <div className="text-xs text-gray-600 flex items-center">
                      <span className="mr-2">✓</span>
                      Unlimited apps
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : upgrade ? (
                    <Button
                      onClick={() => handleUpgrade(plan)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <span className="mr-2">⬆️</span>
                          Upgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  ) : downgrade ? (
                    <div className="space-y-2">
                      <Alert variant="info" className="text-xs">
                        To downgrade, please contact our support team
                      </Alert>
                      <Button
                        onClick={() => handleDowngrade(plan)}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        📞 Contact Support
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan)}
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      disabled={processingPayment}
                    >
                      Select Plan
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Downgrade Contact Modal */}
      {showUpgradeModal && selectedUpgradePlan && isDowngrade(selectedUpgradePlan) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                <span className="text-4xl">📞</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Contact Support for Downgrade</h3>
              <p className="text-gray-600">
                To downgrade from <strong>{currentPlan?.plan?.name}</strong> to <strong>{selectedUpgradePlan.name}</strong>, 
                please contact our support team. We'll help you transition smoothly.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-2">Contact Information:</p>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center">
                  <span className="mr-2">📧</span>
                  <a href="mailto:support@cynayd.com" className="hover:underline">
                    support@cynayd.com
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">💬</span>
                  <span>Live Chat: Available in dashboard</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedUpgradePlan(null);
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.location.href = `mailto:support@cynayd.com?subject=Plan Downgrade Request - ${currentPlan?.plan?.name} to ${selectedUpgradePlan.name}&body=Organization: ${currentPlan?.name || 'N/A'}%0D%0A%0D%0AHello,%0D%0A%0D%0AI would like to request a downgrade from ${currentPlan?.plan?.name} to ${selectedUpgradePlan.name} plan.%0D%0A%0D%0APlease contact me to proceed with the downgrade.`;
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                📧 Send Email
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <Alert
              key={toast.id}
              variant={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}
              className="min-w-[300px]"
            >
              <div className="font-semibold">{toast.title}</div>
              <div className="text-sm">{toast.message}</div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

