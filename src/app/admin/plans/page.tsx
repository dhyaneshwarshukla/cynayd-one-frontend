"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { apiClient, Plan, Pricing, App, AddOn } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

interface AppLimit {
  appId: string;
  appName: string;
  limit: number | null;
  variables: Record<string, any>;
  overagePricing?: Record<string, any>;
}

interface OveragePricing {
  storage: {
    unit: string; // 'GB' or 'MB'
    price: number;
    currency: string;
  };
  [key: string]: any; // For future overage types
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  pricingType: 'flat' | 'per_user';
  features: string[];
  maxUsers: number | null;
  maxApps: number | null;
  maxStorage: string; // In GB
  appLimits: AppLimit[];
  combinedLimits: Record<string, number>;
  overagePricing: OveragePricing;
}

export default function PlansManagementPage() {
  const { user } = useAuth();
  const [toasts, toastActions] = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  const [planFormData, setPlanFormData] = useState<PlanFormData>({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    isDefault: false,
    pricingType: 'flat',
    features: [],
    maxUsers: null,
    maxApps: null,
    maxStorage: '',
    appLimits: [],
    combinedLimits: {},
    overagePricing: {
      storage: {
        unit: 'GB',
        price: 0,
        currency: 'INR'
      }
    }
  });

  const [newFeature, setNewFeature] = useState('');
  const [newPricing, setNewPricing] = useState({
    billingPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    price: '',
    currency: 'INR',
  });

  useEffect(() => {
    document.title = 'Plans & Pricing | CYNAYD One';
    fetchPlans();
    fetchApps();
    fetchAddOns();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPlans();
      setPlans(Array.isArray(data) ? data : []);
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

  const fetchApps = async () => {
    try {
      const data = await apiClient.getApps();
      setApps(data);
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const fetchAddOns = async () => {
    try {
      const data = await apiClient.getAddOns({ isActive: true });
      setAddOns(data);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreatePlan = async () => {
    if (!planFormData.name || !planFormData.slug) {
      toastActions.showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Plan name and slug are required'
      });
      return;
    }

    try {
      const maxStorageBytes = planFormData.maxStorage 
        ? BigInt(Number(planFormData.maxStorage) * 1024 * 1024 * 1024).toString()
        : undefined;

      // Store app limits, combined limits, and overage pricing in features JSON
      const extendedFeatures = {
        features: planFormData.features,
        appLimits: planFormData.appLimits,
        combinedLimits: planFormData.combinedLimits,
        overagePricing: planFormData.overagePricing
      };

      const planData = {
        name: planFormData.name,
        slug: planFormData.slug,
        description: planFormData.description,
        isActive: planFormData.isActive,
        isDefault: planFormData.isDefault,
        pricingType: planFormData.pricingType,
        features: JSON.stringify(extendedFeatures),
        maxUsers: planFormData.maxUsers || undefined,
        maxApps: planFormData.maxApps || undefined,
        maxStorage: maxStorageBytes,
        combinedLimits: Object.keys(planFormData.combinedLimits).length > 0 
          ? JSON.stringify(planFormData.combinedLimits) 
          : undefined,
      };

      await apiClient.createPlan(planData);
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: 'Plan created successfully'
      });
      
      setShowCreateModal(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      toastActions.showToast({
        type: 'error',
        title: 'Failed to create plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !planFormData.name || !planFormData.slug) {
      toastActions.showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Plan name and slug are required'
      });
      return;
    }

    try {
      const maxStorageBytes = planFormData.maxStorage 
        ? BigInt(Number(planFormData.maxStorage) * 1024 * 1024 * 1024).toString()
        : undefined;

      const extendedFeatures = {
        features: planFormData.features,
        appLimits: planFormData.appLimits,
        combinedLimits: planFormData.combinedLimits,
        overagePricing: planFormData.overagePricing
      };

      const planData = {
        name: planFormData.name,
        slug: planFormData.slug,
        description: planFormData.description,
        isActive: planFormData.isActive,
        isDefault: planFormData.isDefault,
        pricingType: planFormData.pricingType,
        features: JSON.stringify(extendedFeatures),
        maxUsers: planFormData.maxUsers || undefined,
        maxApps: planFormData.maxApps || undefined,
        maxStorage: maxStorageBytes,
        combinedLimits: Object.keys(planFormData.combinedLimits).length > 0 
          ? JSON.stringify(planFormData.combinedLimits) 
          : undefined,
      };

      await apiClient.updatePlan(editingPlan.id, planData);
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: 'Plan updated successfully'
      });
      
      setShowEditModal(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      toastActions.showToast({
        type: 'error',
        title: 'Failed to update plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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
      await apiClient.createPricing({
        planId: selectedPlan.id,
        billingPeriod: newPricing.billingPeriod,
        price: Number(newPricing.price),
        currency: newPricing.currency,
      });
      
      toastActions.showToast({
        type: 'success',
        title: 'Success',
        message: 'Pricing added successfully'
      });
      
      setShowPricingModal(false);
      setNewPricing({ billingPeriod: 'monthly', price: '', currency: 'INR' });
      fetchPlans();
    } catch (error) {
      toastActions.showToast({
        type: 'error',
        title: 'Failed to add pricing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    
    // Parse extended features
    const parsedFeatures = parseFeatures(plan.features);
    
    // Parse combinedLimits if exists
    let combinedLimits = {};
    try {
      if (plan.combinedLimits) {
        combinedLimits = JSON.parse(plan.combinedLimits);
      }
    } catch {
      combinedLimits = {};
    }

    setPlanFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      pricingType: plan.pricingType || 'flat',
      features: parsedFeatures.features || [],
      maxUsers: plan.maxUsers || null,
      maxApps: plan.maxApps || null,
      maxStorage: plan.maxStorage ? (Number(plan.maxStorage) / (1024**3)).toString() : '',
      appLimits: parsedFeatures.appLimits || [],
      combinedLimits: parsedFeatures.combinedLimits || combinedLimits,
      overagePricing: parsedFeatures.overagePricing || {
        storage: { unit: 'GB', price: 0, currency: 'INR' }
      }
    });
    
    setShowEditModal(true);
  };

  const resetForm = () => {
    setPlanFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      isDefault: false,
      pricingType: 'flat',
      features: [],
      maxUsers: null,
      maxApps: null,
      maxStorage: '',
      appLimits: [],
      combinedLimits: {},
      overagePricing: {
        storage: {
          unit: 'GB',
          price: 0,
          currency: 'INR'
        }
      }
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setPlanFormData({
        ...planFormData,
        features: [...planFormData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index)
    });
  };

  const toggleAppLimit = (app: App) => {
    const existingIndex = planFormData.appLimits.findIndex(al => al.appId === app.id);
    
    if (existingIndex >= 0) {
      // Remove app limit
      setPlanFormData({
        ...planFormData,
        appLimits: planFormData.appLimits.filter((_, i) => i !== existingIndex)
      });
    } else {
      // Add app limit
      setPlanFormData({
        ...planFormData,
        appLimits: [
          ...planFormData.appLimits,
          {
            appId: app.id,
            appName: app.name,
            limit: null,
            variables: {}
          }
        ]
      });
    }
  };

  const updateAppLimit = (appId: string, field: 'limit' | 'variables', value: any) => {
    setPlanFormData({
      ...planFormData,
      appLimits: planFormData.appLimits.map(al => 
        al.appId === appId 
          ? { ...al, [field]: value }
          : al
      )
    });
  };

  const addAppVariable = (appId: string, varName: string, varValue: any) => {
    const appLimit = planFormData.appLimits.find(al => al.appId === appId);
    if (appLimit) {
      updateAppLimit(appId, 'variables', {
        ...appLimit.variables,
        [varName]: varValue
      });
    }
  };

  const removeAppVariable = (appId: string, varName: string) => {
    const appLimit = planFormData.appLimits.find(al => al.appId === appId);
    if (appLimit) {
      const newVars = { ...appLimit.variables };
      delete newVars[varName];
      updateAppLimit(appId, 'variables', newVars);
    }
  };

  const parseFeatures = (features?: string): any => {
    if (!features) return { features: [], appLimits: [], combinedLimits: {}, overagePricing: null };
    try {
      const parsed = JSON.parse(features);
      if (parsed.features) {
        return {
          features: parsed.features || [],
          appLimits: parsed.appLimits || [],
          combinedLimits: parsed.combinedLimits || {},
          overagePricing: parsed.overagePricing || null
        };
      }
      return { features: Array.isArray(parsed) ? parsed : [], appLimits: [], combinedLimits: {}, overagePricing: null };
    } catch {
      return { features: [], appLimits: [], combinedLimits: {}, overagePricing: null };
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
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Plans</h2>
            <p className="text-gray-600">Manage subscription plans and pricing</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Plans List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const planData = parseFeatures(plan.features);
            const overagePricing = planData.overagePricing;
            
            // Parse combined limits
            let combinedLimits = {};
            try {
              if (plan.combinedLimits) {
                combinedLimits = JSON.parse(plan.combinedLimits);
              } else if (planData.combinedLimits) {
                combinedLimits = planData.combinedLimits;
              }
            } catch {
              combinedLimits = {};
            }

            // Get plan-specific add-ons
            const planAddOns = addOns.filter(a => a.planId === plan.id);
            
            return (
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
                  <div className="flex gap-2 flex-wrap">
                    {plan.isDefault && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
                        Default
                      </span>
                    )}
                    {!plan.isActive && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-400 text-white rounded">
                        Inactive
                      </span>
                    )}
                    {plan.pricingType && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        plan.pricingType === 'per_user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}>
                        {plan.pricingType === 'per_user' ? 'Per User' : 'Flat'}
                      </span>
                    )}
                  </div>
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
                  {overagePricing?.storage && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Extra {overagePricing.storage.unit}:</span>
                      <span className="font-semibold">
                        {overagePricing.storage.price} {overagePricing.storage.currency}/{overagePricing.storage.unit}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Organizations:</span>
                    <span className="font-semibold">{plan._count?.organizations || 0}</span>
                  </div>
                </div>

                {/* Combined Limits */}
                {Object.keys(combinedLimits).length > 0 && (
                  <div className="mb-4 p-2 bg-indigo-50 rounded">
                    <h4 className="text-xs font-semibold text-indigo-700 mb-1">Combined Limits:</h4>
                    <div className="space-y-1">
                      {Object.entries(combinedLimits).map(([key, value]: [string, any]) => (
                        <div key={key} className="text-xs text-indigo-600">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value?.toLocaleString() || value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* App Limits Preview */}
                {planData.appLimits && planData.appLimits.length > 0 && (
                  <div className="mb-4 p-2 bg-gray-50 rounded">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">App Limits:</h4>
                    <div className="space-y-2">
                      {planData.appLimits.slice(0, 3).map((al: AppLimit, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div className="font-semibold text-gray-700">{al.appName}:</div>
                          {al.limit !== null && al.limit !== undefined && (
                            <div className="text-gray-600 ml-2">Limit: {al.limit}</div>
                          )}
                          {al.variables && Object.keys(al.variables).length > 0 && (
                            <div className="ml-2 space-y-0.5">
                              {Object.entries(al.variables).slice(0, 2).map(([key, value]: [string, any]) => (
                                <div key={key} className="text-gray-500">
                                  {key.replace(/_/g, ' ')}: {value}
                                </div>
                              ))}
                              {Object.keys(al.variables).length > 2 && (
                                <div className="text-gray-400">+{Object.keys(al.variables).length - 2} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {planData.appLimits.length > 3 && (
                        <div className="text-xs text-gray-500">+{planData.appLimits.length - 3} more apps</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Plan Add-Ons */}
                {planAddOns.length > 0 && (
                  <div className="mb-4 p-2 bg-green-50 rounded">
                    <h4 className="text-xs font-semibold text-green-700 mb-1">Available Add-Ons ({planAddOns.length}):</h4>
                    <div className="space-y-1">
                      {planAddOns.slice(0, 3).map((addOn) => (
                        <div key={addOn.id} className="text-xs text-green-600">
                          {addOn.name}
                        </div>
                      ))}
                      {planAddOns.length > 3 && (
                        <div className="text-xs text-green-500">+{planAddOns.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {planData.features.slice(0, 3).map((feature: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                    {planData.features.length > 3 && (
                      <li className="text-xs text-gray-500">+{planData.features.length - 3} more</li>
                    )}
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
                          {pricing.currency} {Number(pricing.price).toLocaleString()}
                          {plan.pricingType === 'per_user' && ' / user'}
                          {' / '}
                          {pricing.billingPeriod === 'monthly' ? 'mo' : pricing.billingPeriod === 'quarterly' ? 'q' : 'yr'}
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
                      setShowDetailsModal(true);
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Edit Plan
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowPricingModal(true);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
                  >
                    Add Pricing
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Plan Modal */}
        {showCreateModal && (
          <PlanModal
            title="Create New Plan"
            planFormData={planFormData}
            setPlanFormData={setPlanFormData}
            apps={apps}
            newFeature={newFeature}
            setNewFeature={setNewFeature}
            onClose={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            onSave={handleCreatePlan}
            addFeature={addFeature}
            removeFeature={removeFeature}
            toggleAppLimit={toggleAppLimit}
            updateAppLimit={updateAppLimit}
            addAppVariable={addAppVariable}
            removeAppVariable={removeAppVariable}
          />
        )}

        {/* Edit Plan Modal */}
        {showEditModal && editingPlan && (
          <PlanModal
            title="Edit Plan"
            planFormData={planFormData}
            setPlanFormData={setPlanFormData}
            apps={apps}
            newFeature={newFeature}
            setNewFeature={setNewFeature}
            onClose={() => {
              setShowEditModal(false);
              setEditingPlan(null);
              resetForm();
            }}
            onSave={handleUpdatePlan}
            addFeature={addFeature}
            removeFeature={removeFeature}
            toggleAppLimit={toggleAppLimit}
            updateAppLimit={updateAppLimit}
            addAppVariable={addAppVariable}
            removeAppVariable={removeAppVariable}
          />
        )}

        {/* Add Pricing Modal */}
        {showPricingModal && selectedPlan && (
          <PricingModal
            plan={selectedPlan}
            newPricing={newPricing}
            setNewPricing={setNewPricing}
            onClose={() => {
              setShowPricingModal(false);
              setNewPricing({ billingPeriod: 'monthly', price: '', currency: 'INR' });
            }}
            onSave={handleAddPricing}
          />
        )}

        {/* Plan Details Modal */}
        {showDetailsModal && selectedPlan && (
          <PlanDetailsModal
            plan={selectedPlan}
            apps={apps}
            addOns={addOns}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedPlan(null);
            }}
          />
        )}
      </div>
    </UnifiedLayout>
  );
}

// Plan Details Modal Component - Shows all plan information including add-ons
function PlanDetailsModal({
  plan,
  apps,
  addOns,
  onClose,
}: {
  plan: Plan;
  apps: App[];
  addOns: AddOn[];
  onClose: () => void;
}) {
  // Parse features function (local to modal)
  const parseFeatures = (features?: string | null): any => {
    if (!features) return { features: [], appLimits: [], combinedLimits: {}, overagePricing: null };
    try {
      const parsed = JSON.parse(features);
      if (parsed.features) {
        return {
          features: parsed.features || [],
          appLimits: parsed.appLimits || [],
          combinedLimits: parsed.combinedLimits || {},
          overagePricing: parsed.overagePricing || null
        };
      }
      return { features: Array.isArray(parsed) ? parsed : [], appLimits: [], combinedLimits: {}, overagePricing: null };
    } catch {
      return { features: [], appLimits: [], combinedLimits: {}, overagePricing: null };
    }
  };

  const planData = parseFeatures(plan.features);
  
  // Parse combined limits
  let combinedLimits = {};
  try {
    if (plan.combinedLimits) {
      combinedLimits = JSON.parse(plan.combinedLimits);
    } else if (planData.combinedLimits) {
      combinedLimits = planData.combinedLimits;
    }
  } catch {
    combinedLimits = {};
  }

  // Get plan-specific add-ons
  const planAddOns = addOns.filter(a => a.planId === plan.id);
  
  // Get app details for app limits
  const getAppDetails = (appId: string) => {
    return apps.find(a => a.id === appId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Pricing Type</div>
              <div className="text-lg font-semibold text-blue-900">
                {plan.pricingType === 'per_user' ? 'Per User' : 'Flat'}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Max Users</div>
              <div className="text-lg font-semibold text-green-900">
                {plan.maxUsers ? plan.maxUsers.toLocaleString() : 'Unlimited'}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Max Storage</div>
              <div className="text-lg font-semibold text-purple-900">
                {plan.maxStorage 
                  ? `${(Number(plan.maxStorage) / (1024**3)).toFixed(0)}GB` 
                  : 'Unlimited'}
              </div>
            </div>
          </div>

          {/* Pricing */}
          {plan.pricings && plan.pricings.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="space-y-2">
                {plan.pricings.map((pricing, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium capitalize">{pricing.billingPeriod}</span>
                      {plan.pricingType === 'per_user' && (
                        <span className="text-sm text-gray-500 ml-2">per user</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {pricing.currency} {Number(pricing.price).toLocaleString()}
                      <span className="text-sm font-normal text-gray-600 ml-1">
                        / {pricing.billingPeriod === 'monthly' ? 'mo' : pricing.billingPeriod === 'quarterly' ? 'q' : 'yr'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Limits */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Limits</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Max Users</div>
                <div className="text-lg font-semibold">
                  {plan.maxUsers ? plan.maxUsers.toLocaleString() : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Max Apps</div>
                <div className="text-lg font-semibold">
                  {plan.maxApps ? plan.maxApps.toLocaleString() : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Max Storage</div>
                <div className="text-lg font-semibold">
                  {plan.maxStorage 
                    ? `${(Number(plan.maxStorage) / (1024**3)).toFixed(0)}GB` 
                    : 'Unlimited'}
                </div>
              </div>
            </div>
          </div>

          {/* Combined Limits */}
          {Object.keys(combinedLimits).length > 0 && (
            <div className="border rounded-lg p-4 bg-indigo-50">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">Combined Limits (All Apps)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(combinedLimits).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white p-3 rounded">
                    <div className="text-sm text-indigo-600 mb-1">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-lg font-semibold text-indigo-900">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* App Limits */}
          {planData.appLimits && planData.appLimits.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">App-Specific Limits</h3>
              <div className="space-y-4">
                {planData.appLimits.map((appLimit: AppLimit, idx: number) => {
                  const app = getAppDetails(appLimit.appId);
                  return (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r">
                      <div className="flex items-center mb-2">
                        <h4 className="text-md font-semibold text-gray-900">
                          {appLimit.appName || app?.name || 'Unknown App'}
                        </h4>
                        {appLimit.limit !== null && appLimit.limit !== undefined && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Limit: {appLimit.limit}
                          </span>
                        )}
                      </div>
                      
                      {/* Variables */}
                      {appLimit.variables && Object.keys(appLimit.variables).length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">Variables:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(appLimit.variables).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Overage Pricing */}
                      {appLimit.overagePricing && Object.keys(appLimit.overagePricing).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium text-orange-700 mb-2">Overage Pricing:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(appLimit.overagePricing).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between text-sm bg-orange-50 p-2 rounded">
                                <span className="text-orange-700">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  {value.unit && ` (${value.unit})`}
                                </span>
                                <span className="font-semibold text-orange-900">
                                  {value.currency} {value.price?.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Features */}
          {planData.features && planData.features.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {planData.features.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center text-sm">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-Ons */}
          {planAddOns.length > 0 && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                Available Add-Ons ({planAddOns.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {planAddOns.map((addOn) => {
                  const pricing = typeof addOn.pricing === 'string' 
                    ? JSON.parse(addOn.pricing) 
                    : addOn.pricing;
                  const config = typeof addOn.configuration === 'string'
                    ? JSON.parse(addOn.configuration)
                    : addOn.configuration;
                  
                  return (
                    <div key={addOn.id} className="bg-white p-4 rounded border border-green-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{addOn.name}</h4>
                          {addOn.description && (
                            <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          {addOn.category}
                        </span>
                      </div>
                      
                      {config && (
                        <div className="text-xs text-gray-500 mb-2">
                          {config.amount && `${config.amount} ${config.unit || ''}`.trim()}
                          {config.type && ` • ${config.type}`}
                        </div>
                      )}
                      
                      {pricing && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-sm font-semibold text-gray-900">Pricing:</div>
                          <div className="text-xs text-gray-600 space-y-1 mt-1">
                            {pricing.monthly && (
                              <div>Monthly: {pricing.currency} {pricing.monthly.toLocaleString()}</div>
                            )}
                            {pricing.yearly && (
                              <div>Yearly: {pricing.currency} {pricing.yearly.toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan Status */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`text-sm font-semibold ${plan.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Default Plan</div>
                <div className={`text-sm font-semibold ${plan.isDefault ? 'text-blue-600' : 'text-gray-600'}`}>
                  {plan.isDefault ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Organizations</div>
                <div className="text-sm font-semibold text-gray-900">
                  {plan._count?.organizations || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-medium hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Plan Modal Component
function PlanModal({
  title,
  planFormData,
  setPlanFormData,
  apps,
  newFeature,
  setNewFeature,
  onClose,
  onSave,
  addFeature,
  removeFeature,
  toggleAppLimit,
  updateAppLimit,
  addAppVariable,
  removeAppVariable,
}: {
  title: string;
  planFormData: PlanFormData;
  setPlanFormData: (data: PlanFormData) => void;
  apps: App[];
  newFeature: string;
  setNewFeature: (feature: string) => void;
  onClose: () => void;
  onSave: () => void;
  addFeature: () => void;
  removeFeature: (index: number) => void;
  toggleAppLimit: (app: App) => void;
  updateAppLimit: (appId: string, field: 'limit' | 'variables', value: any) => void;
  addAppVariable: (appId: string, varName: string, varValue: any) => void;
  removeAppVariable: (appId: string, varName: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'apps' | 'overage'>('basic');
  const [newVarName, setNewVarName] = useState<Record<string, string>>({});
  const [newVarValue, setNewVarValue] = useState<Record<string, string>>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleAddVariable = (appId: string) => {
    const varName = newVarName[appId]?.trim();
    const varValue = newVarValue[appId]?.trim();
    
    if (varName && varValue) {
      addAppVariable(appId, varName, varValue);
      setNewVarName({ ...newVarName, [appId]: '' });
      setNewVarValue({ ...newVarValue, [appId]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'basic'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('apps')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'apps'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              App Limits
            </button>
            <button
              onClick={() => setActiveTab('overage')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'overage'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Overage Pricing
            </button>
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={planFormData.name}
                  onChange={(e) => {
                    setPlanFormData({
                      ...planFormData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Professional Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={planFormData.slug}
                  onChange={(e) => setPlanFormData({ ...planFormData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="professional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Type
                </label>
                <select
                  value={planFormData.pricingType}
                  onChange={(e) => setPlanFormData({ 
                    ...planFormData, 
                    pricingType: e.target.value as 'flat' | 'per_user' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="flat">Flat Pricing</option>
                  <option value="per_user">Per User Pricing</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {planFormData.pricingType === 'per_user' 
                    ? 'Price will be multiplied by number of users' 
                    : 'Fixed price regardless of users'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Plan description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Users
                  </label>
                  <input
                    type="number"
                    value={planFormData.maxUsers || ''}
                    onChange={(e) => setPlanFormData({
                      ...planFormData,
                      maxUsers: e.target.value ? Number(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Apps
                  </label>
                  <input
                    type="number"
                    value={planFormData.maxApps || ''}
                    onChange={(e) => setPlanFormData({
                      ...planFormData,
                      maxApps: e.target.value ? Number(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Storage (GB)
                </label>
                <input
                  type="number"
                  value={planFormData.maxStorage}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxStorage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="100"
                />
              </div>

              {/* Combined Limits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Combined Limits (across all apps)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Set limits that apply across all apps (e.g., total API calls, webhook events)
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="metric_name (e.g., total_api_calls)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const [name, value] = input.value.split(':').map(s => s.trim());
                          if (name && value) {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              setPlanFormData({
                                ...planFormData,
                                combinedLimits: {
                                  ...planFormData.combinedLimits,
                                  [name]: numValue
                                }
                              });
                              input.value = '';
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  {Object.keys(planFormData.combinedLimits).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(planFormData.combinedLimits).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-indigo-50 p-2 rounded text-sm">
                          <span>
                            <span className="font-semibold">{key.replace(/_/g, ' ')}:</span> {value?.toLocaleString() || value}
                          </span>
                          <button
                            onClick={() => {
                              const newLimits = { ...planFormData.combinedLimits };
                              delete newLimits[key];
                              setPlanFormData({ ...planFormData, combinedLimits: newLimits });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Format: metric_name:value (e.g., total_api_calls:100000)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={planFormData.isActive}
                    onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={planFormData.isDefault}
                    onChange={(e) => setPlanFormData({ ...planFormData, isDefault: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Default Plan</span>
                </label>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add feature..."
                  />
                  <button
                    onClick={addFeature}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {planFormData.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{feature}</span>
                      <button
                        onClick={() => removeFeature(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* App Limits Tab */}
          {activeTab === 'apps' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select apps and configure their limits for this plan
              </p>
              
              <div className="space-y-3">
                {apps.map((app) => {
                  const appLimit = planFormData.appLimits.find(al => al.appId === app.id);
                  const isSelected = !!appLimit;

                  return (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAppLimit(app)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium">{app.name}</span>
                          {app.description && (
                            <span className="text-sm text-gray-500">- {app.description}</span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="ml-6 space-y-3 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Limit
                            </label>
                            <input
                              type="number"
                              value={appLimit?.limit || ''}
                              onChange={(e) => updateAppLimit(
                                app.id,
                                'limit',
                                e.target.value ? Number(e.target.value) : null
                              )}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Leave empty for unlimited"
                            />
                          </div>

                          {/* Variables */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Variables
                            </label>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={newVarName[app.id] || ''}
                                onChange={(e) => setNewVarName({
                                  ...newVarName,
                                  [app.id]: e.target.value
                                })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Variable name"
                              />
                              <input
                                type="text"
                                value={newVarValue[app.id] || ''}
                                onChange={(e) => setNewVarValue({
                                  ...newVarValue,
                                  [app.id]: e.target.value
                                })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Variable value"
                              />
                              <button
                                onClick={() => handleAddVariable(app.id)}
                                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                              >
                                Add
                              </button>
                            </div>
                            <div className="space-y-1">
                              {appLimit && Object.entries(appLimit.variables).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                  <span>
                                    <strong>{key}:</strong> {String(value)}
                                  </span>
                                  <button
                                    onClick={() => removeAppVariable(app.id, key)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overage Pricing Tab */}
          {activeTab === 'overage' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Configure pricing for usage beyond plan limits
              </p>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Storage Overage</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <select
                      value={planFormData.overagePricing.storage.unit}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        overagePricing: {
                          ...planFormData.overagePricing,
                          storage: {
                            ...planFormData.overagePricing.storage,
                            unit: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="GB">GB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={planFormData.overagePricing.storage.price}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        overagePricing: {
                          ...planFormData.overagePricing,
                          storage: {
                            ...planFormData.overagePricing.storage,
                            price: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={planFormData.overagePricing.storage.currency}
                      onChange={(e) => setPlanFormData({
                        ...planFormData,
                        overagePricing: {
                          ...planFormData.overagePricing,
                          storage: {
                            ...planFormData.overagePricing.storage,
                            currency: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="INR"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Example: Extra {planFormData.overagePricing.storage.unit} costs {planFormData.overagePricing.storage.price} {planFormData.overagePricing.storage.currency} per {planFormData.overagePricing.storage.unit}
                </p>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
            >
              Save Plan
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pricing Modal Component
function PricingModal({
  plan,
  newPricing,
  setNewPricing,
  onClose,
  onSave,
}: {
  plan: Plan;
  newPricing: {
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    price: string;
    currency: string;
  };
  setNewPricing: (pricing: typeof newPricing) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Add Pricing for {plan.name}</h2>
        
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
              placeholder="200"
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
              placeholder="INR"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
          >
            Add Pricing
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
