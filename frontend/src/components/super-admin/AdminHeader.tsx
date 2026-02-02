import { Bell, Search, Plus, UserPlus, FileText, Send, Download, CreditCard, Settings, Zap, Users, Ticket, DollarSign, AlertCircle, CheckCircle2, Check, Trash2 } from "lucide-react";
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
import { useState } from "react";

const initialNotifications = [
  {
    id: 1,
    type: "subscriber",
    title: "New Enterprise Subscriber",
    description: "Ahmad Al-Rashid upgraded to Enterprise plan",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    type: "payment",
    title: "Payment Received",
    description: "Invoice #INV-2024-156 paid - 299 KD",
    time: "15 min ago",
    unread: true,
  },
  {
    id: 3,
    type: "ticket",
    title: "New Support Ticket",
    description: "High priority ticket from Sara Mohamed",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 4,
    type: "alert",
    title: "System Alert",
    description: "3 failed payment attempts detected",
    time: "2 hours ago",
    unread: false,
  },
  {
    id: 5,
    type: "success",
    title: "Bulk Email Sent",
    description: "Newsletter sent to 1,234 subscribers",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: 6,
    type: "subscriber",
    title: "New Pro Subscriber",
    description: "Fatima Hassan signed up for Pro plan",
    time: "5 hours ago",
    unread: false,
  },
  {
    id: 7,
    type: "payment",
    title: "Refund Processed",
    description: "Refund of 49 KD issued to Omar Khalid",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 8,
    type: "ticket",
    title: "Ticket Resolved",
    description: "Ticket #TKT-892 marked as resolved",
    time: "Yesterday",
    unread: false,
  },
];

const notificationIcons: Record<string, React.ReactNode> = {
  subscriber: <Users className="w-4 h-4 text-blue-500" />,
  payment: <DollarSign className="w-4 h-4 text-green-500" />,
  ticket: <Ticket className="w-4 h-4 text-yellow-500" />,
  alert: <AlertCircle className="w-4 h-4 text-red-500" />,
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

export function AdminHeader() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [sheetOpen, setSheetOpen] = useState(false);
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

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
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            </div>
            <ScrollArea className="h-[280px]">
              <div className="divide-y">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      notification.unread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    )}
                  </div>
                ))}
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
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 opacity-50" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`flex gap-3 p-4 rounded-lg border transition-colors ${
                                  notification.unread ? "bg-primary/5 border-primary/20" : "border-border"
                                }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  {notificationIcons[notification.type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium">{notification.title}</p>
                                    <div className="flex items-center gap-1">
                                      {notification.unread && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => markAsRead(notification.id)}
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteNotification(notification.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
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
                                className="flex gap-3 p-4 rounded-lg border bg-primary/5 border-primary/20"
                              >
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  {notificationIcons[notification.type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium">{notification.title}</p>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => markAsRead(notification.id)}
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteNotification(notification.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
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
