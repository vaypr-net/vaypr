import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useReminders } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  FileCheck,
  Receipt,
  Wallet,
  Users, 
  Bell, 
  LogOut,
  Menu,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/quotes', label: 'Quotes', icon: FileCheck },
  { href: '/dashboard/receipts', label: 'Receipts', icon: Receipt },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/recurring', label: 'Subscriptions', icon: RefreshCw },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe },
  { href: '/dashboard/expenses', label: 'Expenses', icon: Wallet },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { reminders, unreadCount, markAsRead } = useReminders();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadReminders = reminders.filter(r => !r.isRead).slice(0, 5);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold">VAYPR</span>
        <div className="flex items-center gap-2">
          <NotificationDropdown 
            reminders={unreadReminders} 
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
          />
        </div>
      </header>

      {/* Sidebar - Fixed on all screens */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 h-screen bg-sidebar border-r transform transition-transform duration-200 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className="p-6 border-b flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">VAYPR</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t">
            <Link 
              to="/dashboard/profile"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || (user as any)?.profileImage || (user as any)?.profilePicture || undefined} />
                <AvatarFallback className="text-primary-foreground text-sm font-medium bg-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start mt-2 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - Offset by sidebar on desktop */}
      <main className="lg:ml-64 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4 items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <NotificationDropdown 
              reminders={unreadReminders} 
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
            />
            <Link 
              to="/generator" 
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium shadow-glow hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Invoice Generator</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NotificationDropdown({ 
  reminders, 
  unreadCount,
  onMarkAsRead 
}: { 
  reminders: any[]; 
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b">
          <h4 className="font-semibold">Notifications</h4>
        </div>
        {reminders.length === 0 ? (
          <div className="px-3 py-6 text-center text-muted-foreground text-sm">
            No new notifications
          </div>
        ) : (
          reminders.map((reminder) => (
            <DropdownMenuItem 
              key={reminder.id} 
              className="flex flex-col items-start px-3 py-2 cursor-pointer"
              onClick={() => onMarkAsRead(reminder.id)}
            >
              <span className="font-medium text-sm">{reminder.title}</span>
              <span className="text-xs text-muted-foreground">{reminder.message}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/notifications" className="w-full text-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
