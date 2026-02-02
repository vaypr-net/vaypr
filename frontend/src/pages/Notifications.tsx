import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useReminders, useInvoices, useQuotes } from '@/hooks/useData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  FileText, 
  FileCheck, 
  AlertTriangle,
  Clock,
  Calendar,
  Filter,
  Sparkles
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const { reminders, markAsRead, markAllAsRead, deleteReminder } = useReminders();
  const { invoices } = useInvoices();
  const { quotes } = useQuotes();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Generate smart notifications from data
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const pendingQuotes = quotes.filter(q => q.status === 'sent');
  const expiringQuotes = quotes.filter(q => {
    if (!q.validUntil || q.status !== 'sent') return false;
    const expiry = new Date(q.validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  // Combine reminders with smart notifications
  const smartNotifications = [
    ...overdueInvoices.map(inv => ({
      id: `overdue-${inv.id}`,
      type: 'overdue' as const,
      title: `Invoice ${inv.invoiceNumber} is overdue`,
      message: `Payment of KD ${inv.total.toFixed(3)} from ${inv.clientName} is past due`,
      dueDate: inv.dueDate,
      isRead: false,
      icon: AlertTriangle,
      severity: 'high' as const,
    })),
    ...expiringQuotes.map(quote => ({
      id: `expiring-${quote.id}`,
      type: 'expiring' as const,
      title: `Quote ${quote.quoteNumber} expiring soon`,
      message: `Quote for ${quote.clientName} expires on ${format(new Date(quote.validUntil), 'MMM d')}`,
      dueDate: quote.validUntil,
      isRead: false,
      icon: Clock,
      severity: 'medium' as const,
    })),
    ...reminders.map(r => ({
      id: r.id,
      type: 'reminder' as const,
      title: r.title,
      message: r.message,
      dueDate: r.dueDate,
      isRead: r.isRead,
      icon: Bell,
      severity: 'low' as const,
    })),
  ];

  const filteredNotifications = smartNotifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.dueDate);
    let groupKey: string;
    
    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else if (isThisWeek(date)) {
      groupKey = 'This Week';
    } else {
      groupKey = 'Earlier';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, typeof smartNotifications>);

  const unreadCount = smartNotifications.filter(n => !n.isRead).length;
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  const getSeverityStyles = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'border-l-destructive bg-destructive/5';
      case 'medium':
        return 'border-l-warning bg-warning/5';
      default:
        return 'border-l-primary bg-muted/30';
    }
  };

  const handleMarkAsRead = (id: string) => {
    if (id.startsWith('overdue-') || id.startsWith('expiring-')) {
      // These are auto-generated, can't mark as read in local storage
      return;
    }
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    if (id.startsWith('overdue-') || id.startsWith('expiring-')) {
      return;
    }
    deleteReminder(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Stay updated with your invoices, quotes, and reminders
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overdueInvoices.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiringQuotes.length}</p>
                  <p className="text-xs text-muted-foreground">Expiring</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/20">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{smartNotifications.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Bell className="h-4 w-4" />
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-2">
              <BellOff className="h-4 w-4" />
              Read
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <NotificationsList 
              groupedNotifications={groupedNotifications}
              groupOrder={groupOrder}
              getSeverityStyles={getSeverityStyles}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          </TabsContent>
          
          <TabsContent value="unread" className="mt-6">
            <NotificationsList 
              groupedNotifications={groupedNotifications}
              groupOrder={groupOrder}
              getSeverityStyles={getSeverityStyles}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          </TabsContent>
          
          <TabsContent value="read" className="mt-6">
            <NotificationsList 
              groupedNotifications={groupedNotifications}
              groupOrder={groupOrder}
              getSeverityStyles={getSeverityStyles}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

interface NotificationItem {
  id: string;
  type: 'overdue' | 'expiring' | 'reminder';
  title: string;
  message: string;
  dueDate: string;
  isRead: boolean;
  icon: React.ElementType;
  severity: 'high' | 'medium' | 'low';
}

function NotificationsList({ 
  groupedNotifications, 
  groupOrder,
  getSeverityStyles,
  onMarkAsRead,
  onDelete
}: { 
  groupedNotifications: Record<string, NotificationItem[]>;
  groupOrder: string[];
  getSeverityStyles: (severity: 'high' | 'medium' | 'low') => string;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const hasNotifications = Object.keys(groupedNotifications).length > 0;

  if (!hasNotifications) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-muted mb-4">
            <BellOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No notifications</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            You're all caught up! New notifications will appear here when you have overdue invoices, expiring quotes, or reminders.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupOrder.map(group => {
        const notifications = groupedNotifications[group];
        if (!notifications || notifications.length === 0) return null;

        return (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">{group}</h3>
              <Badge variant="outline" className="text-xs">
                {notifications.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                
                return (
                  <Card 
                    key={notification.id}
                    className={cn(
                      "border-l-4 transition-all hover:shadow-md",
                      getSeverityStyles(notification.severity),
                      notification.isRead && "opacity-60"
                    )}
                  >
                    <CardContent className="flex items-start gap-4 py-4">
                      <div className={cn(
                        "p-2 rounded-full shrink-0",
                        notification.severity === 'high' && "bg-destructive/20",
                        notification.severity === 'medium' && "bg-warning/20",
                        notification.severity === 'low' && "bg-primary/20",
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          notification.severity === 'high' && "text-destructive",
                          notification.severity === 'medium' && "text-warning",
                          notification.severity === 'low' && "text-primary",
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              !notification.isRead && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {!notification.isRead && notification.type === 'reminder' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onMarkAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {notification.type === 'reminder' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => onDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={
                              notification.severity === 'high' ? 'destructive' : 
                              notification.severity === 'medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {notification.type === 'overdue' && 'Overdue Invoice'}
                            {notification.type === 'expiring' && 'Expiring Quote'}
                            {notification.type === 'reminder' && 'Reminder'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
