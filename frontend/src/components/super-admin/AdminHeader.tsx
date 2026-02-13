import { Bell, Search, Plus, UserPlus, FileText, Send, Download, CreditCard, Settings, Zap, Users, Ticket, DollarSign, AlertCircle, CheckCircle2, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useGetActivities } from "@/hooks/api/useActivities";

function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

const activityToNotificationIcon: Record<string, React.ReactNode> = {
  new_subscriber: <Users className="w-4 h-4 text-blue-500" />,
  upgrade: <Zap className="w-4 h-4 text-green-500" />,
  downgrade: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  payment: <DollarSign className="w-4 h-4 text-green-500" />,
  payment_failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  canceled: <Trash2 className="w-4 h-4 text-red-500" />,
  ticket: <Ticket className="w-4 h-4 text-yellow-500" />,
  ticket_resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  affiliate: <Users className="w-4 h-4 text-purple-500" />,
  referral: <Users className="w-4 h-4 text-purple-500" />,
  invoice_sent: <FileText className="w-4 h-4 text-blue-500" />,
  domain_verified: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  reactivated: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

export function AdminHeader() {
  const navigate = useNavigate();
  const { data: activitiesData, isLoading } = useGetActivities(100, 0);
  const [deletedActivities, setDeletedActivities] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Map API activities to notification format
  const notifications = useMemo(() => {
    if (!activitiesData?.data) return [];
    
    return activitiesData.data
      .filter(activity => !deletedActivities.includes(activity._id))
      .map((activity) => ({
        id: activity._id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        time: formatTimeAgo(activity.createdAt),
        unread: !activity.isRead,
      }));
  }, [activitiesData, deletedActivities]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/activities/${id}/read`, { method: 'PATCH' });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/activities/all/read', { method: 'PATCH' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = (id: string) => {
    setDeletedActivities(prev => [...prev, id]);
  };

  const clearAllNotifications = () => {
    setDeletedActivities(activitiesData?.data?.map(a => a._id) || []);
  };

  const unreadCount = activitiesData?.unreadCount || 0;
  const unreadNotifications = notifications.filter(n => n.unread);

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search subscribers, plans, tickets..." 
            className="pl-10 bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive rounded-full text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] max-w-[calc(100vw-1.5rem)] p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            </div>
            <ScrollArea className="h-[280px]">
              <div className="divide-y">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${notification.unread ? 'bg-muted/30' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {notification.unread && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      )}
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        {activityToNotificationIcon[notification.type] || <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={`text-sm leading-5 line-clamp-2 ${notification.unread ? 'font-semibold' : 'font-medium'}`}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                          {notification.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full text-sm" size="sm">
                    View all notifications
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg">
                  <SheetHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <SheetTitle>All Notifications</SheetTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllAsRead}
                          disabled={unreadCount === 0}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark all read
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearAllNotifications}
                          disabled={notifications.length === 0}
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
                        All ({notifications.length})
                      </TabsTrigger>
                      <TabsTrigger value="unread" className="flex-1">
                        Unread ({unreadCount})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all">
                      <ScrollArea className="h-[calc(100vh-200px)]">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 opacity-50" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className="flex gap-3 p-4 rounded-lg border border-border"
                              >
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  {activityToNotificationIcon[notification.type] || <Bell className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium">{notification.title}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {notification.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="unread">
                      <ScrollArea className="h-[calc(100vh-200px)]">
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                          <p>All caught up!</p>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Zap className="w-4 h-4" />
              Quick Actions
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Affiliates</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/super-admin/affiliates")} className="cursor-pointer">
              <UserPlus className="w-4 h-4 mr-2" />
              + Add Affiliate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/super-admin/affiliates")} className="cursor-pointer">
              <Ticket className="w-4 h-4 mr-2" />
              + Create Coupon
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Support</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/super-admin/support")} className="cursor-pointer">
              <Ticket className="w-4 h-4 mr-2" />
              Create Support Ticket
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/super-admin/support")} className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              View Open Tickets
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/")} className="cursor-pointer">
              <Send className="w-4 h-4 mr-2" />
              Go to Landing Page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/super-admin/settings")} className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
