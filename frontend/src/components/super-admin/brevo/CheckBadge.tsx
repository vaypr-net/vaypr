import { Check, X, Clock } from 'lucide-react';
import { DomainChecks } from '@/api/services/brevo.service';

interface CheckBadgeProps {
  status: DomainChecks[keyof DomainChecks];
  label: string;
  className?: string;
}

const checkStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  OK: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: <Check className="h-3 w-3" />,
  },
  FAIL: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <X className="h-3 w-3" />,
  },
  PENDING: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: <Clock className="h-3 w-3" />,
  },
  MISSING: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: <Clock className="h-3 w-3" />,
  },
};

export function CheckBadge({ status, label, className = '' }: CheckBadgeProps) {
  const style = checkStyles[status] || checkStyles.PENDING;
  const displayLabel = status === 'MISSING' ? 'Optional' : status;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text} ${className}`}
      title={`${label}: ${displayLabel}`}
    >
      {style.icon}
      <span>{label}</span>
    </span>
  );
}
