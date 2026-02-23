import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useReminders, useInvoices, useQuotes } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCircle2, Clock, Trash2, AlertTriangle, X } from 'lucide-react';
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

  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  const expiringQuotes = quotes.filter((q) => {
    if (!q.validUntil || q.status !== 'sent') return false;
    const expiry = new Date(q.validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  const smartNotifications: NotificationItem[] = [
    ...overdueInvoices.map((inv) => ({
      id: `overdue-${inv.id}`,
      type: 'overdue' as const,
      title: `Invoice ${inv.invoiceNumber} is overdue`,
      description: `Payment of KD ${inv.total.toFixed(3)} from ${inv.clientName} is past due`,
      eventAt: inv.updatedAt || inv.dueDate || inv.createdAt,
      isRead: false,
      deletable: false,
    })),
    ...expiringQuotes.map((quote) => ({
      id: `expiring-${quote.id}`,
      type: 'expiring' as const,
      title: `Quote ${quote.quoteNumber} expiring soon`,
      description: `Quote for ${quote.clientName} expires soon`,
      eventAt: quote.validUntil || quote.createdAt,
      isRead: false,
      deletable: false,
    })),
    ...reminders.map((r) => ({
      id: r.id,
      type: 'reminder' as const,
      title: r.title,
      description: r.message,
      eventAt: r.createdAt || r.dueDate,
      isRead: r.isRead,
      deletable: true,
    })),
  ];

  const readGeneratedKey = 'notifications:readGeneratedIds';
  const [readGeneratedIds, setReadGeneratedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(readGeneratedKey);
      if (!raw) return new Set<string>();
      return new Set<string>(JSON.parse(raw));
    } catch {
      return new Set<string>();
    }
  });

  const persistReadGeneratedIds = (set: Set<string>) => {
    try {
      localStorage.setItem(readGeneratedKey, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  };

  const addReadGeneratedId = (id: string) => {
    setReadGeneratedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistReadGeneratedIds(next);
      return next;
    });
  };

  const markAllGeneratedAsRead = (ids: string[]) => {
    setReadGeneratedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      persistReadGeneratedIds(next);
      return next;
    });
  };

  const normalizedNotifications = useMemo(
    () =>
      smartNotifications
        .map((n) => {
          if (n.id.startsWith('overdue-') || n.id.startsWith('expiring-')) {
            return { ...n, isRead: readGeneratedIds.has(n.id) };
          }
          return n;
        })
        .sort((a, b) => {
          const aDate = safeDateValue(a.eventAt)?.getTime() ?? 0;
          const bDate = safeDateValue(b.eventAt)?.getTime() ?? 0;
          return bDate - aDate;
        }),
    [smartNotifications, readGeneratedIds],
  );

  const unreadCount = normalizedNotifications.filter((n) => !n.isRead).length;
  const unreadNotifications = normalizedNotifications.filter((n) => !n.isRead);

  const handleMarkAsRead = (id: string) => {
    if (id.startsWith('overdue-') || id.startsWith('expiring-')) {
      addReadGeneratedId(id);
      return;
    }
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    if (id.startsWith('overdue-') || id.startsWith('expiring-')) return;
    deleteReminder(id);
  };

  const markAll = () => {
    markAllAsRead();
    const generatedIds = [
      ...overdueInvoices.map((inv) => `overdue-${inv.id}`),
      ...expiringQuotes.map((q) => `expiring-${q.id}`),
    ];
    markAllGeneratedAsRead(generatedIds);
  };

  const clearAll = () => {
    reminders.forEach((item) => deleteReminder(item.id));
    const generatedIds = [
      ...overdueInvoices.map((inv) => `overdue-${inv.id}`),
      ...expiringQuotes.map((q) => `expiring-${q.id}`),
    ];
    markAllGeneratedAsRead(generatedIds);
  };

  const renderIcon = (type: NotificationType) => {
    if (type === 'overdue') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (type === 'expiring') return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] -m-6 bg-black/35 flex justify-end">
        <div className="w-full sm:max-w-lg bg-background border-l border-border shadow-xl">
          <div className="flex items-center justify-between p-6 pb-4">
            <h1 className="text-3xl font-semibold tracking-tight">All Notifications</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={markAll} disabled={unreadCount === 0}>
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full px-6">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all" className="flex-1">
                All ({normalizedNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[calc(100vh-240px)] pr-1">
                {normalizedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {normalizedNotifications.map((notification) => (
                      <div key={notification.id} className="flex gap-3 p-4 rounded-lg border border-border">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {renderIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              )}
                              {notification.deletable && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDelete(notification.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(notification.eventAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread">
              <ScrollArea className="h-[calc(100vh-240px)] pr-1">
                {unreadNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                    <p>All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex gap-3 p-4 rounded-lg border border-border cursor-pointer"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {renderIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(notification.eventAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
