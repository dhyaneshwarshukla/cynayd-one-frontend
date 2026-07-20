'use client';

import React from 'react';
import { AccessOpsActionGuard } from './PermissionGuard';
import { Button } from '../common/Button';
import { useAccessOpsFlow } from './AccessOpsFlowContext';

export function AccessOpsShellActions() {
  const { openGiveAccess, openRemoveAccess } = useAccessOpsFlow();

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="AccessOps primary actions">
      <AccessOpsActionGuard permission="accessops.grants.request" feature="grants">
        <Button type="button" size="sm" onClick={() => openGiveAccess()}>
          Give access
        </Button>
      </AccessOpsActionGuard>
      <AccessOpsActionGuard permission="accessops.grants.revoke" feature="revocation">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-red-300 text-red-700"
          onClick={() => openRemoveAccess()}
        >
          Remove access
        </Button>
      </AccessOpsActionGuard>
    </div>
  );
}
