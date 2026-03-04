import { format } from 'date-fns';
import { 
  FileText, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  Pencil,
} from 'lucide-react';
import { QuoteTimelineEvent } from '@/types/app';
import { cn } from '@/lib/utils';

interface QuoteTimelineProps {
  events: QuoteTimelineEvent[];
  createdAt: string;
}

const eventConfig: Record<string, {
  icon: typeof FileText; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  created: { 
    icon: FileText, 
    label: 'Quote Created', 
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  sent: { 
    icon: Send, 
    label: 'Quote Sent', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  viewed: { 
    icon: Eye, 
    label: 'Client Viewed', 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  accepted: { 
    icon: CheckCircle, 
    label: 'Client Accepted', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  rejected: { 
    icon: XCircle, 
    label: 'Client Declined', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  modification_requested: { 
    icon: MessageSquare, 
    label: 'Edit Requested', 
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  edited: {
    icon: Pencil,
    label: 'Quote Edited',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
};

export function QuoteTimeline({ events, createdAt }: QuoteTimelineProps) {
  // Always show "Created" first
  const allEvents: QuoteTimelineEvent[] = [
    {
      id: 'created-event',
      type: 'created',
      timestamp: createdAt,
    },
    ...events.filter(e => e.type !== 'created'),
  ];

  // Sort by timestamp
  const sortedEvents = allEvents.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Quote Journey Timeline
      </h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-3">
          {sortedEvents.map((event, index) => {
            const config =
              eventConfig[event.type as keyof typeof eventConfig] ||
              {
                icon: Clock,
                label: 'Status Updated',
                color: 'text-muted-foreground',
                bgColor: 'bg-muted',
              };
            const Icon = config.icon;
            const isLast = index === sortedEvents.length - 1;
            
            return (
              <div key={event.id} className="relative flex items-start gap-3 pl-1">
                {/* Icon circle */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-7 h-7 rounded-full border-2 border-background",
                  config.bgColor
                )}>
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                
                {/* Content */}
                <div className={cn(
                  "flex-1 pb-3",
                  isLast && "pb-0"
                )}>
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm font-medium", config.color)}>
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {event.message && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{event.message}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
