import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingPlanService } from '@/api/services/billing-plan.service';
import { useGetPlans } from '@/hooks/api/useBillingPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Globe, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDomainLimits() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [domainLimit, setDomainLimit] = useState<string>('');
  const [customEmailDomain, setCustomEmailDomain] = useState<boolean>(false);

  // Fetch all plans using the existing hook
  const { data: plansData, isLoading: plansLoading } = useGetPlans();
  const plans = plansData?.items || [];

  // Update plan mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const plan = plans.find((p) => p._id === selectedPlan);
      if (!plan) throw new Error('Plan not found');
      
      const limit = domainLimit === 'unlimited' ? -1 : parseInt(domainLimit, 10);
      await BillingPlanService.updatePlan(selectedPlan, {
        limits: {
          ...plan.limits,
          domains: limit,
          customEmailDomain,
        },
      });
    },
    onSuccess: () => {
      toast.success('Domain limits updated for plan');
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update limits');
    },
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find((p) => p._id === planId);
    if (plan) {
      setDomainLimit(plan.limits.domains === -1 ? 'unlimited' : String(plan.limits.domains ?? 0));
      setCustomEmailDomain(plan.limits.customEmailDomain ?? false);
    }
  };

  const handleSave = () => {
    if (!selectedPlan || !domainLimit) {
      toast.error('Please select a plan and domain limit');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Domain Limits Configuration */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configure Domain Limits
          </CardTitle>
          <CardDescription>
            Set how many custom domains each billing plan can have
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Plan Selection */}
            <div>
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                <SelectTrigger id="plan" className="mt-1">
                  <SelectValue placeholder="Choose a plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name} ({plan.price > 0 ? `KWD ${plan.price}` : 'Free'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domain Limit */}
            <div>
              <Label htmlFor="domain-limit">Domain Limit</Label>
              <Select value={domainLimit} onValueChange={setDomainLimit}>
                <SelectTrigger id="domain-limit" className="mt-1">
                  <SelectValue placeholder="Choose limit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not Allowed (0)</SelectItem>
                  <SelectItem value="1">1 Domain</SelectItem>
                  <SelectItem value="3">3 Domains</SelectItem>
                  <SelectItem value="5">5 Domains</SelectItem>
                  <SelectItem value="10">10 Domains</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Email Domain Toggle */}
            <div>
              <Label htmlFor="email-domain" className="flex items-center gap-2 mt-1">
                <input
                  id="email-domain"
                  type="checkbox"
                  checked={customEmailDomain}
                  onChange={(e) => setCustomEmailDomain(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Allow Custom Email Domain</span>
              </Label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!selectedPlan || updateMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Plans Summary</CardTitle>
          <CardDescription>Current domain limits for all plans</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Domain Limit</TableHead>
                  <TableHead>Custom Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plansLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading plans...
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        {plan.price > 0 ? (
                          <Badge variant="outline">KWD {plan.price}</Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.limits.domains === -1 ? (
                          <Badge className="bg-green-600">Unlimited</Badge>
                        ) : plan.limits.domains === 0 ? (
                          <Badge variant="destructive">Not Allowed</Badge>
                        ) : (
                          <Badge variant="outline">{plan.limits.domains}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.limits.customEmailDomain ? (
                          <Badge variant="default">Enabled</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Domain Limit Guide:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>0</strong> = Users cannot add any domains (must upgrade)</li>
              <li><strong>1-10</strong> = Limited number of custom domains</li>
              <li><strong>-1 (Unlimited)</strong> = Users can add unlimited custom domains</li>
              <li><strong>Custom Email</strong> = Whether users can send emails from custom domains</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
