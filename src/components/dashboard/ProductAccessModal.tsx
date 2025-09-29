"use client";

import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ProductCard, ProductWithAccess } from './ProductCard';

interface User {
  id: string;
  name?: string;
  email: string;
}

interface ProductAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithAccess;
  users: User[];
  onAssignAccess: (userId: string, quota?: number, expiresAt?: string) => Promise<void>;
  onRevokeAccess: (userId: string) => Promise<void>;
  onUpdateQuota: (userId: string, quota: number) => Promise<void>;
}

export const ProductAccessModal: React.FC<ProductAccessModalProps> = ({
  isOpen,
  onClose,
  product,
  users,
  onAssignAccess,
  onRevokeAccess,
  onUpdateQuota,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [quota, setQuota] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignAccess = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await onAssignAccess(
        selectedUserId,
        quota ? parseInt(quota) : undefined,
        expiresAt || undefined
      );
      
      // Reset form
      setSelectedUserId('');
      setQuota('');
      setExpiresAt('');
    } catch (err) {
      setError('Failed to assign access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await onRevokeAccess(userId);
    } catch (err) {
      setError('Failed to revoke access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuota = async (userId: string, newQuota: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await onUpdateQuota(userId, newQuota);
    } catch (err) {
      setError('Failed to update quota');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Manage Access - {product.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Assign New Access */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Assign Access</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quota (Optional)
              </label>
              <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At (Optional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={handleAssignAccess}
              disabled={isLoading || !selectedUserId}
              loading={isLoading}
            >
              Assign Access
            </Button>
          </div>
        </div>

        {/* Current Access List */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Current Access</h4>
          <div className="space-y-3">
            {users.map((user) => {
              const userAccess = product.userAccess; // This would need to be filtered per user
              return (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{user.name || user.email}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {userAccess && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span>Quota: {userAccess.quota || 'Unlimited'}</span>
                        {userAccess.expiresAt && (
                          <span className="ml-2">
                            Expires: {new Date(userAccess.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {userAccess ? (
                      <>
                        <Button
                          onClick={() => handleRevokeAccess(user.id)}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          Revoke
                        </Button>
                        <Button
                          onClick={() => {
                            const newQuota = prompt('Enter new quota:', userAccess.quota?.toString() || '');
                            if (newQuota && !isNaN(parseInt(newQuota))) {
                              handleUpdateQuota(user.id, parseInt(newQuota));
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                        >
                          Update Quota
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">No access</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
