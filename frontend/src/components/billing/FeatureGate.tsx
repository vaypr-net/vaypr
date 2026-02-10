import { ReactNode } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useBillingStatus } from '@/hooks/useBillingStatus';

interface FeatureGateProps {
  feature: string;
  requiredPlan?: 'Pro' | 'Business' | 'Enterprise';
  children: ReactNode;
}

/**
 * Feature Gate Component - Shows upgrade prompt for free plan users
 * 
 * Usage:
 * <FeatureGate feature="customBranding" requiredPlan="Pro">
 *   <CustomBrandingSettings />
 * </FeatureGate>
 */
export function FeatureGate({ feature, requiredPlan = 'Pro', children }: FeatureGateProps) {
  const { canAccessFeature, planName, isLoading } = useBillingStatus();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canAccessFeature(feature)) {
    return (
      <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-900 mb-2">
              {feature.charAt(0).toUpperCase() + feature.slice(1)} - Premium Feature
            </h3>
            <p className="text-orange-800 mb-4">
              This feature is only available on the <span className="font-semibold">{requiredPlan}</span> plan.
              You're currently on the <span className="font-semibold">{planName}</span> plan.
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}

interface UpgradePromptProps {
  feature: string;
  requiredPlan?: string;
  compact?: boolean;
}

/**
 * Upgrade Prompt - Inline prompt for limited features
 * 
 * Usage:
 * {limitReached && <UpgradePrompt feature="invoices" />}
 */
export function UpgradePrompt({ feature, requiredPlan = 'Pro', compact = false }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { planName } = useBillingStatus();

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm text-amber-800">
          Limit reached. <button onClick={() => navigate('/pricing')} className="underline font-semibold">
            Upgrade to {requiredPlan}
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
      <h4 className="font-bold text-amber-900 mb-2">
        Upgrade to {requiredPlan}
      </h4>
      <p className="text-sm text-amber-800 mb-4">
        You've reached your {feature} limit on the {planName} plan. Upgrade to get unlimited {feature}.
      </p>
      <Button
        onClick={() => navigate('/pricing')}
        variant="outline"
        className="border-amber-300 hover:bg-amber-100"
      >
        View Plans
      </Button>
    </div>
  );
}

interface LimitedFeatureBannerProps {
  current: number;
  max: number;
  feature: string;
  upgradeLink?: boolean;
}

/**
 * Limited Feature Banner - Shows usage and limits
 * 
 * Usage:
 * <LimitedFeatureBanner current={5} max={5} feature="invoices" upgradeLink />
 */
export function LimitedFeatureBanner({
  current,
  max,
  feature,
  upgradeLink = true,
}: LimitedFeatureBannerProps) {
  const navigate = useNavigate();
  const percentage = (current / max) * 100;
  const isAtLimit = current >= max;

  return (
    <div className={`p-4 rounded-lg border ${
      isAtLimit
        ? 'bg-red-50 border-red-200'
        : percentage > 80
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold ${
          isAtLimit ? 'text-red-900' : percentage > 80 ? 'text-yellow-900' : 'text-blue-900'
        }`}>
          {feature.charAt(0).toUpperCase() + feature.slice(1)} Usage
        </span>
        <span className="text-sm font-mono">
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${
            isAtLimit ? 'bg-red-600' : percentage > 80 ? 'bg-yellow-600' : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isAtLimit && upgradeLink && (
        <button
          onClick={() => navigate('/pricing')}
          className="mt-3 text-sm text-red-700 underline font-semibold hover:text-red-900"
        >
          Upgrade for unlimited
        </button>
      )}
    </div>
  );
}
