import { fireEvent, render, screen } from '@testing-library/react';
import { FiltersBar } from '../components';

describe('RiskInsights FiltersBar', () => {
  it('updates filters through callbacks', () => {
    const setRiskLevel = jest.fn();
    const setSearch = jest.fn();
    const setWindowDays = jest.fn();

    render(
      <FiltersBar
        riskLevel="all"
        setRiskLevel={setRiskLevel}
        search=""
        setSearch={setSearch}
        windowDays={30}
        setWindowDays={setWindowDays}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '90' } });
    fireEvent.change(selects[1], { target: { value: 'high' } });
    fireEvent.change(screen.getByPlaceholderText('Search name or email'), {
      target: { value: 'alice@example.com' },
    });

    expect(setWindowDays).toHaveBeenCalledWith(90);
    expect(setRiskLevel).toHaveBeenCalledWith('high');
    expect(setSearch).toHaveBeenCalledWith('alice@example.com');
  });
});
