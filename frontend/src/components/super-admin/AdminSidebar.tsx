import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Receipt, BarChart3, MessageSquare, Users2, Settings, FileText, PenTool } from "lucide-react";
const navItems = [{
  label: "Overview",
  icon: LayoutDashboard,
  href: "/super-admin"
}, {
  label: "Page Editor",
  icon: PenTool,
  href: "/super-admin/page-editor"
}, {
  label: "Subscribers",
  icon: Users,
  href: "/super-admin/subscribers"
}, {
  label: "Plans & Billing",
  icon: CreditCard,
  href: "/super-admin/plans"
}, {
  label: "Transactions",
  icon: Receipt,
  href: "/super-admin/transactions"
}, {
  label: "Reports & Analytics",
  icon: BarChart3,
  href: "/super-admin/reports"
}, {
  label: "Support Center",
  icon: MessageSquare,
  href: "/super-admin/support"
}, {
  label: "Affiliate Program",
  icon: Users2,
  href: "/super-admin/affiliates"
}, {
  label: "Settings",
  icon: Settings,
  href: "/super-admin/settings"
}];
export function AdminSidebar() {
  const location = useLocation();
  return <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/super-admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">VAYPR</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(item => {
        const isActive = location.pathname === item.href || item.href !== "/super-admin" && location.pathname.startsWith(item.href);
        return <Link key={item.href} to={item.href} className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>;
      })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Super Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@vaypr.net</p>
          </div>
        </div>
      </div>
    </aside>;
}