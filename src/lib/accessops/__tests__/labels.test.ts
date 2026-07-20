import { displayRiskLevel, humanizeProvisioningMode } from '../labels';

describe('AccessOps labels', () => {
  it('uses pilot-friendly provisioning labels', () => {
    expect(humanizeProvisioningMode('CYNAYD_SSO_ONLY')).toBe('Access controlled by Cynayd');
  });

  it('shows not classified risk when missing', () => {
    expect(displayRiskLevel(null)).toBe('Not classified');
    expect(displayRiskLevel('NOT_CLASSIFIED')).toBe('Not classified');
  });
});
