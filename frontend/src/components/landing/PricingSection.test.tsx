import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PricingSection } from './PricingSection';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'qa' }, token: 'test' }) }));
vi.mock('@/hooks/useLandingPage', () => ({ useLandingPage: () => ({ data: null }) }));
vi.mock('@/api/services/billing.service', () => ({ billingService: { getConfiguration: async () =>
  ({ provider: 'hesabe', environment: 'sandbox', autoRenew: false, referralsEnabled: false }) } }));

describe('Hesabe sandbox pricing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ items: [
      { _id: 'paid', name: 'Business', price: 20, currency: 'KWD', features: [], limits: {}, status: 'active' },
    ] }) })));
  });
  afterEach(() => vi.unstubAllGlobals());
  it('shows an accurate yearly total and explicit sandbox/manual-renewal consent', async () => {
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><PricingSection /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText(/Hesabe sandbox payments/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Yearly/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('KWD 204.000 for one year');
    expect(screen.getByRole('dialog')).toHaveTextContent('Automatic renewal and referral commissions are not enabled');
    expect(screen.getByRole('button', { name: 'Continue to Hesabe sandbox' })).toBeInTheDocument();
  });
});
