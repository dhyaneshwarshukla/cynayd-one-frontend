// Team Management component has been removed
// Organizations are now managed through the registration process only
// Users can only add and manage their access and permissions within their organization

import React from 'react';
import { Card } from '../common/Card';

export const TeamManagement: React.FC = () => {
  return (
    <Card className="p-8 text-center">
      <div className="text-6xl mb-4">🏢</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Management</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Organizations are created during user registration. Users can only add and manage 
        their access and permissions within their existing organization.
      </p>
      <p className="text-sm text-gray-500">
        To create a new organization, please register a new account with organization details.
      </p>
    </Card>
  );
};