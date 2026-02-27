import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useReminders, useInvoices, useQuotes } from '@/hooks/useData';
import { notificationService } from '@/api/services/notification.service';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Bell, Check, CheckCircle2, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type NotificationType = 'overdue' | 'expiring' | 'reminder';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  eventAt: string;
  isRead: boolean;
  deletable: boolean;
}

const safeDateValue = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTimeAgo = (value?: string) => {
  const date = safeDateValue(value);
  if (!date) return 'Unknown time';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const { reminders, markAsRead, markAllAsRead, deleteReminder } = useReminders();
  const { invoices } = useInvoices();
  const { quotes } = useQuotes();

  // Track dismissed notifications (so they don't come back on refresh)
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('user-dismissed-notifications') || '[]');
    } catch {
      return [];
    }
  });

  // Persist dismissed notifications to localStorage
  useEffect(() => {
    localStorage.setItem('user-dismissed-notifications', JSON.stringify(dismissedNotifications));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('dismissedNotificationsChanged'));
  }, [dismissedNotifications]);

  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  const expiringQuotes = quotes.filter((q) => {
    if (!q.validUntil || q.status !== 'sent') return false;
    const expiry = new Date(q.validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  const normalizedNotifications = useMemo(
    () => {
      const notifications: NotificationItem[] = [
        ...overdueInvoices
          .filter((inv) => !dismissedNotifications.includes(`overdue-${inv.id}`))
          .map((inv) => ({
            id: `overdue-${inv.id}`,
            type: 'overdue' as const,
            title: `Invoice ${inv.invoiceNumber} is overdue`,
            description: `Payment of KD ${inv.total.toFixed(3)} from ${inv.clientName} is past due`,
            eventAt: inv.updatedAt || inv.dueDate || inv.createdAt,
            isRead: false,
            deletable: false,
          })),
        ...expiringQuotes
          .filter((q) => !dismissedNotifications.includes(`expiring-${q.id}`))
          .map((quote) => ({
            id: `expiring-${quote.id}`,
            type: 'expiring' as const,
            title: `Quote ${quote.quoteNumber} expiring soon`,
            description: `Quote for ${quote.clientName} expires soon`,
            eventAt: quote.validUntil || quote.createdAt,
            isRead: false,
            deletable: false,
          })),
        ...reminders
          .filter((r) => !dismissedNotifications.includes(r.id))
          .map((r) => ({
            id: r.id,
            type: 'reminder' as const,
            title: r.title,
            description: r.message,
            eventAt: r.createdAt || r.dueDate,
            isRead: r.isRead,
            deletable: true,
          })),
      ];
      
      return notifications.sort((a, b) => {
        const aDate = safeDateValue(a.eventAt)?.getTime() ?? 0;
        const bDate = safeDateValue(b.eventAt)?.getTime() ?? 0;
        return bDate - aDate;
      });
    },
    [overdueInvoices, expiringQuotes, reminders, dismissedNotifications],
  );

  const unreadCount = normalizedNotifications.filter((n) => !n.isRead).length;
  const unreadNotifications = normalizedNotifications.filter((n) => !n.isRead);

  const handleMarkAsRead = (id: string) => {
    if (id.startsWith('overdue-') || id.startsWith('expiring-')) {
      // For generated notifications, dismiss them when marking as read
      setDismissedNotifications((prev) => [...prev, id]);
      return;
    }

    // Persist read state for server-backed notifications
    notificationService.markAsRead(id).catch(() => {
      // Ignore local-only reminders that don't exist on the server
    });

    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    // Dismiss the notification from display
    setDismissedNotifications((prev) => [...prev, id]);
    
    // If it's a reminder (not a generated notification), also delete it
    if (!id.startsWith('overdue-') && !id.startsWith('expiring-')) {
      deleteReminder(id);
    }
  };

  const markAll = () => {
    const unreadReminderIds = reminders.filter((r) => !r.isRead).map((r) => r.id);

    // Persist read state for server-backed notifications in background
    unreadReminderIds.forEach((id) => {
      notificationService.markAsRead(id).catch(() => {
        // Ignore local-only reminders
      });
    });

    // Mark all reminders as read via hook
    markAllAsRead();
    
    // Dismiss all generated notifications (overdue & expiring)
    const generatedIds = normalizedNotifications
      .filter((n) => n.id.startsWith('overdue-') || n.id.startsWith('expiring-'))
      .map((n) => n.id);
    
    setDismissedNotifications((prev) => [...new Set([...prev, ...generatedIds])]);
  };

  const clearAll = () => {
    // Delete all reminders
    reminders.forEach((item) => deleteReminder(item.id));
    
    // Dismiss all notifications (generated and custom)
    const allIds = normalizedNotifications.map((n) => n.id);
    setDismissedNotifications((prev) => [...new Set([...prev, ...allIds])]);
  };

  const renderIcon = (type: NotificationType) => {
    if (type === 'overdue') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (type === 'expiring') return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  return (
    <DashboardLayout>
      <Sheet open={true} onOpenChange={() => navigate('/dashboard')}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>All Notifications</SheetTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAll}
                  disabled={unreadCount === 0}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  disabled={normalizedNotifications.length === 0}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all" className="flex-1">
                All ({normalizedNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ScrollArea className="h-[calc(100vh-200px)]">
                {normalizedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {normalizedNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className="flex gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {renderIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-5">{notification.title}</p>
                              <p className="text-xs text-muted-foreground leading-5 mt-1">{notification.description}</p>
                              <p className="text-[11px] text-muted-foreground mt-1.5">{formatTimeAgo(notification.eventAt)}</p>
                            </div>
                            {(notification.deletable) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread">
              <ScrollArea className="h-[calc(100vh-200px)]">
                {unreadNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                    <p>All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {renderIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-5">{notification.title}</p>
                          <p className="text-xs text-muted-foreground leading-5 mt-1">{notification.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-1.5">{formatTimeAgo(notification.eventAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function renderIcon(type: NotificationType) {
  if (type === 'overdue') return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (type === 'expiring') return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
  return <Bell className="w-3.5 h-3.5 text-blue-500" />;
}
