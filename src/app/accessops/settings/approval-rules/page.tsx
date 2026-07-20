'use client';

import React, { useEffect, useState } from 'react';
import { accessOpsClient } from '../../../../lib/accessops/client';
import { useAccessOpsFlow } from '../../../../components/accessops/AccessOpsFlowContext';
import { Button } from '../../../../components/common/Button';

export default function ApprovalRulesPage() {
  const { openGiveAccess } = useAccessOpsFlow();
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    accessOpsClient.listAccessRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  const pending = requests.filter((request) => String(request.status).toUpperCase().includes('PENDING')).length;
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold">Approval rules</h1><p className="mt-1 text-sm text-gray-600">Approval routing is managed by AccessOps policies. Rules evaluate the person, application, risk, and requested duration when access is requested.</p></div>
      <div className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Request summary</h2><p className="mt-2 text-sm text-gray-600">{pending} pending request(s) out of {requests.length} recent request(s).</p></div>
      <Button type="button" onClick={() => openGiveAccess()}>Create access request</Button>
    </div>
  );
}
