"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { apiClient, Plan, Pricing } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

export default function PlansManagementPage() {
  const { user } = useAuth();
  const [toasts, toastActions] = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [newPricing, setNewPricing] = useState({
    billingPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    price: '',
    currency: 'USD',
  });

  useEffect(() => {
    document.title = 'Plans & Pricing | CYNAYD One';
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toastActions.showToast({
        type: 'error',
        title: 'Failed to load plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPricing = async () => {
    if (!selectedPlan || !newPricing.price) {
      toastActions.showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all fields'
      });
      return;
    }

    try {
      // Note: This requires SUPER_ADMIN auth, so it won't work from frontend
      // For now, just show info
      toastActions.showToast({
        type: 'info',
        title: 'Action Required',
        message: 'Use API tools or admin panel to add pricing'
      });
      setShowPricingModal(false);
      setNewPricing({ billingPeriod: 'monthly', price: '', currency: 'USD' });
    } catch (error) {
      toastActions.showToast({
        type: 'error',
        title: 'Failed to add pricing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const parseFeatures = (features?: string): string[] => {
    if (!features) return [];
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <UnifiedLayout title="Plans & Pricing" subtitle="Manage subscription plans" variant="dashboard">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout 
      title="Plans & Pricing Management" 
      subtitle="Configure subscription plans for organizations"
      variant="dashboard"
    >
      <div className="space-y-6">
        {/* Plans List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border-2 rounded-lg p-6 ${
                plan.isDefault
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                {plan.isDefault && (
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
                    Default
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

              {/* Limits */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Users:</span>
                  <span className="font-semibold">{plan.maxUsers ? plan.maxUsers.toLocaleString() : 'Unlimited'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Apps:</span>
                  <span className="font-semibold">{plan.maxApps ? plan.maxApps.toLocaleString() : 'Unlimited'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Storage:</span>
                  <span className="font-semibold">
                    {plan.maxStorage 
                      ? `${(Number(plan.maxStorage) / (1024**3)).toFixed(0)}GB` 
                      : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Organizations:</span>
                  <span className="font-semibold">{plan._count?.organizations || 0}</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
                <ul className="space-y-1">
                  {parseFeatures(plan.features).slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricings */}
              {plan.pricings && plan.pricings.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Pricing:</h4>
                  {plan.pricings.map((pricing, idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{pricing.billingPeriod}:</span>
                      <span className="font-semibold">
                        ${Number(pricing.price).toLocaleString()} / {pricing.billingPeriod === 'monthly' ? 'mo' : pricing.billingPeriod === 'quarterly' ? 'q' : 'yr'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowPricingModal(true);
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                >
                  Add Pricing
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Pricing Modal */}
        {showPricingModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Add Pricing for {selectedPlan.name}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Period
                  </label>
                  <select
                    value={newPricing.billingPeriod}
                    onChange={(e) => setNewPricing({ ...newPricing, billingPeriod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPricing.price}
                    onChange={(e) => setNewPricing({ ...newPricing, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="29.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={newPricing.currency}
                    onChange={(e) => setNewPricing({ ...newPricing, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddPricing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                >
                  Add Pricing
                </button>
                <button
                  onClick={() => {
                    setShowPricingModal(false);
                    setNewPricing({ billingPeriod: 'monthly', price: '', currency: 'USD' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}

