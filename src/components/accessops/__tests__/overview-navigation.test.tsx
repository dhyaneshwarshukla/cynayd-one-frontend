/** @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { buildOverviewSummaryCards } from '../../../lib/accessops/ui-helpers';

describe('Overview summary navigation', () => {
  it('routes high-signal cards to the simplified workspace', () => {
    const cards = buildOverviewSummaryCards({
      usersWithAccess: 8,
      applications: 3,
      pendingRequests: 2,
      accessExpiringSoon: 1,
      failedRemovals: 1,
      connectorStatus: 'Connected',
    });
    render(<div>{cards.map((card) => <a key={card.key} href={card.href}>{card.label}</a>)}</div>);
    expect(screen.getByRole('link', { name: 'Pending requests' }).getAttribute('href')).toBe('/accessops/activity?filter=requests');
    expect(screen.getByRole('link', { name: 'Failed removals' }).getAttribute('href')).toBe('/accessops/activity?filter=failed');
    expect(screen.getByRole('link', { name: 'Connector status' }).getAttribute('href')).toBe('/accessops/settings/connections');
  });
});
