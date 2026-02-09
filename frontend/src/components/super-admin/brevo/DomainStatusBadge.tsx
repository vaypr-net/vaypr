import { BrevoD } from '@/api/services/brevo.service';

interface DomainStatusBadgeProps {
  status: BrevoD['status'];
  className?: string;
}

const statusStyles: Record<BrevoD['status'], { bg: string; text: string; label: string }> = {
  NOT_STARTED: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Not started',
  },
  DNS_PENDING: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Waiting DNS',
  },
  VERIFIED: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Verified',
  },
  FAILED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Action needed',
  },
};

export function DomainStatusBadge({ status, className = '' }: DomainStatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.NOT_STARTED;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}>
      {style.label}
    </span>
  );
}
