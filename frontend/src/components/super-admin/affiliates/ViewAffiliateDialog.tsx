import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { Affiliate } from "@/api/services/affiliate.service";
import { User, Mail, Phone, Hash, Award, TrendingUp, DollarSign, Calendar, Clock } from "lucide-react";
import { formatDateDMYLong } from "@/lib/document-date";

interface ViewAffiliateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: Affiliate | null;
}

export function ViewAffiliateDialog({ open, onOpenChange, affiliate }: ViewAffiliateDialogProps) {
  if (!affiliate) return null;

  const formatDate = (dateString: string | undefined) => {
    return formatDateDMYLong(dateString);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-medium text-primary">
                {affiliate.name.split(" ").map((n: string) => n[0]).join("")}
              </span>
            </div>
            <div>
              <div className="text-xl font-semibold">{affiliate.name}</div>
              <div className="text-sm text-muted-foreground font-normal">Affiliate Details</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm">{affiliate.email}</div>
                </div>
              </div>
              {affiliate.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm">{affiliate.phone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Affiliate Information */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Affiliate Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Referral Code</div>
                  <code className="text-sm px-2 py-1 bg-muted rounded">{affiliate.code}</code>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Commission Tier</div>
                  <Badge variant="outline" className="text-sm">{affiliate.tier}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                    {affiliate.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <div className="text-xs text-blue-600 font-medium">Referrals</div>
                </div>
                <div className="text-2xl font-bold text-blue-900">{affiliate.referrals}</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div className="text-xs text-green-600 font-medium">Total Earnings</div>
                </div>
                <div className="text-2xl font-bold text-green-900">{formatCurrency(affiliate.earnings)}</div>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div className="text-xs text-orange-600 font-medium">Pending</div>
                </div>
                <div className="text-2xl font-bold text-orange-900">{formatCurrency(affiliate.pending)}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Important Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Join Date</div>
                  <div className="text-sm">{formatDate(affiliate.joinDate || affiliate.createdAt)}</div>
                </div>
              </div>
              {affiliate.lastPaymentDate && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Last Payment</div>
                    <div className="text-sm">{formatDate(affiliate.lastPaymentDate)}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Created At</div>
                  <div className="text-sm">{formatDate(affiliate.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Last Updated</div>
                  <div className="text-sm">{formatDate(affiliate.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
