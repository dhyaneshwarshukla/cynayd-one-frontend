/** @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AccessOpsActionGuard } from '../PermissionGuard';

jest.mock('../../../lib/accessops/permissions', () => ({
  useAccessOpsCapabilities: jest.fn(),
}));

const { useAccessOpsCapabilities } = jest.requireMock('../../../lib/accessops/permissions');

describe('AccessOpsActionGuard', () => {
  it('hides unauthorized actions instead of rendering them', () => {
    useAccessOpsCapabilities.mockReturnValue({
      features: { enabled: true, read: true, revocation: true },
      can: () => false,
      loading: false,
    });

    render(
      <AccessOpsActionGuard permission="accessops.grants.revoke">
        <button type="button">Revoke</button>
      </AccessOpsActionGuard>
    );

    expect(screen.queryByRole('button', { name: 'Revoke' })).toBeNull();
  });

  it('renders actions when permission is granted', () => {
    useAccessOpsCapabilities.mockReturnValue({
      features: { enabled: true, read: true, revocation: true },
      can: () => true,
      loading: false,
    });

    render(
      <AccessOpsActionGuard permission="accessops.grants.revoke">
        <button type="button">Revoke</button>
      </AccessOpsActionGuard>
    );

    expect(screen.getByRole('button', { name: 'Revoke' })).toBeTruthy();
  });
});
