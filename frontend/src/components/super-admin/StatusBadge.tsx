interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "canceled" | "free" | "succeeded" | "failed" | "refunded" | "open" | "resolved" | "in_progress" | "closed";
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  succeeded: "bg-green-100 text-green-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  open: "bg-blue-100 text-blue-700",
  free: "bg-purple-100 text-purple-700",
  canceled: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-amber-100 text-amber-700",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  succeeded: "Succeeded",
  resolved: "Resolved",
  closed: "Closed",
  inactive: "Inactive",
  pending: "Pending",
  in_progress: "In Progress",
  open: "Open",
  free: "Free",
  canceled: "Canceled",
  failed: "Failed",
  refunded: "Refunded",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${statusStyles[status] || statusStyles.inactive} ${className}`}>
      {statusLabels[status] || status}
    </span>
  );
}
