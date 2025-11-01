"use client";

import { useState, useEffect } from 'react';
import { apiClient, Plan, Pricing } from '@/lib/api-client';

interface PricingSectionProps {
  highlightPlan?: string; // slug of plan to highlight
}

export default function PricingSection({ highlightPlan }: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getPlans(true); // Get only active plans
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string, currency: string = 'INR'): string => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) return 'Free';
    
    if (currency === 'INR') {
      return `₹${Math.round(numPrice).toLocaleString('en-IN')}`;
    }
    return `$${numPrice.toLocaleString()}`;
  };

  const getPriceForPeriod = (pricings: Pricing[] | undefined): Pricing | null => {
    if (!pricings || pricings.length === 0) return null;
    return pricings.find(p => p.billingPeriod === selectedPeriod) || pricings[0];
  };

  const formatStorage = (storage: string | undefined): string => {
    if (!storage) return 'Unlimited';
    const bytes = BigInt(storage);
    const gb = Number(bytes) / (1024 ** 3);
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)}TB`;
    return `${gb.toFixed(0)}GB`;
  };

  const parseFeatures = (features: string | undefined): string[] => {
    if (!features) return [];
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include our complete ecosystem with enterprise-grade security.
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            {(['monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-3 rounded-md font-semibold transition-all ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const pricing = getPriceForPeriod(plan.pricings);
            const isHighlighted = plan.slug === highlightPlan || plan.isDefault;
            const features = parseFeatures(plan.features);
            const isFreePlan = plan.slug === 'free';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 relative transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-105 z-10'
                    : 'bg-white border border-gray-200 hover:shadow-xl transform hover:-translate-y-2'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 px-4 py-1 rounded-bl-lg rounded-tr-2xl text-sm font-bold">
                    Most Popular
                  </div>
                )}

                <div className={`mb-6 ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  {plan.description && (
                    <p className={`text-sm ${isHighlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">{formatPrice(pricing?.price || '0', pricing?.currency || 'INR')}</span>
                    {!isFreePlan && pricing && (
                      <span className={`ml-2 text-lg ${isHighlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                        /{selectedPeriod === 'monthly' ? 'mo' : selectedPeriod === 'yearly' ? 'yr' : 'qtr'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="mb-8 space-y-3">
                  {features.slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                          isHighlighted ? 'text-white' : 'text-green-600'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className={isHighlighted ? 'text-blue-100' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                  
                  {/* Plan Limits */}
                  <li className={`pt-3 border-t ${isHighlighted ? 'border-blue-400' : 'border-gray-200'}`}>
                    <div className="space-y-2">
                      {plan.maxUsers && (
                        <div className="flex items-center justify-between">
                          <span className={isHighlighted ? 'text-blue-100' : 'text-gray-600'}>Max Users:</span>
                          <span className={isHighlighted ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>
                            {plan.maxUsers.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {plan.maxApps && (
                        <div className="flex items-center justify-between">
                          <span className={isHighlighted ? 'text-blue-100' : 'text-gray-600'}>Max Apps:</span>
                          <span className={isHighlighted ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>
                            {plan.maxApps.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={isHighlighted ? 'text-blue-100' : 'text-gray-600'}>Storage:</span>
                        <span className={isHighlighted ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>
                          {formatStorage(plan.maxStorage)}
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>

                {/* CTA Button */}
                <a
                  href="/auth/register"
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                    isHighlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isFreePlan ? 'Get Started' : 'Get Started'}
                </a>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            All plans include 24/7 support, enterprise security, and regular platform updates.
          </p>
          <a href="#contact" className="text-blue-600 hover:text-blue-700 font-semibold">
            Need a custom plan? Contact Sales →
          </a>
        </div>
      </div>
    </section>
  );
}

