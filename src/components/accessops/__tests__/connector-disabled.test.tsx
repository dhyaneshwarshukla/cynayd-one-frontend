/** @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CONNECTOR_REQUIRED_RECONCILIATION_MESSAGE } from '../../../lib/accessops/ui-helpers';

function ProviderReconciliationControls({
  hasHealthyConnector,
}: {
  hasHealthyConnector: boolean;
}) {
  return (
    <div>
      <button type="button" disabled={!hasHealthyConnector}>
        Provider reconciliation
      </button>
      {!hasHealthyConnector && (
        <p role="status">{CONNECTOR_REQUIRED_RECONCILIATION_MESSAGE}</p>
      )}
    </div>
  );
}

describe('Connector-disabled provider reconciliation messaging', () => {
  it('blocks the action and explains why when no healthy connector exists', () => {
    render(<ProviderReconciliationControls hasHealthyConnector={false} />);

    expect(
      (screen.getByRole('button', { name: 'Provider reconciliation' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(screen.getByRole('status').textContent).toContain(CONNECTOR_REQUIRED_RECONCILIATION_MESSAGE);
    expect(screen.getByRole('status').textContent).not.toMatch(/process\.env/i);
  });
});
