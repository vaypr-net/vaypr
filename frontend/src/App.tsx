// v1.0.2 - Enhanced deployment with Nixpacks and locked dependencies
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/super-admin/AdminLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import Index from "./pages/Index";
import Generator from "./pages/Generator";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Quotes from "./pages/Quotes";
import Receipts from "./pages/Receipts";
import Clients from "./pages/Clients";
import Recurring from "./pages/Recurring";
import Expenses from "./pages/Expenses";
import Domains from "./pages/Domains";
import QuoteView from "./pages/QuoteView";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import Guides from "./pages/Guides";
import AboutUs from "./pages/AboutUs";
import B2BServices from "./pages/B2BServices";
import AdminOverview from "./pages/super-admin/Overview";
import PageEditor from "./pages/super-admin/PageEditor";
import Subscribers from "./pages/super-admin/Subscribers";
import Plans from "./pages/super-admin/Plans";
import Transactions from "./pages/super-admin/Transactions";
import Reports from "./pages/super-admin/Reports";
import Support from "./pages/super-admin/Support";
import Affiliates from "./pages/super-admin/Affiliates";
import Settings from "./pages/super-admin/Settings";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/payment/Success";
import PaymentCancel from "./pages/payment/Cancel";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Super admins should only access /super-admin, not /dashboard
  if (user.isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/generator" element={<Generator />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/dashboard/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
      <Route path="/dashboard/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
      <Route path="/dashboard/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/dashboard/recurring" element={<ProtectedRoute><Recurring /></ProtectedRoute>} />
      <Route path="/dashboard/domains" element={<ProtectedRoute><Domains /></ProtectedRoute>} />
      <Route path="/dashboard/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/billing/success" element={<BillingSuccess />} />
      <Route path="/billing/cancel" element={<BillingCancel />} />
      <Route path="/quote/:token" element={<QuoteView />} />
      <Route path="/faqs" element={<FAQs />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/guides" element={<Guides />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/b2b" element={<B2BServices />} />
      <Route path="/super-admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminOverview />} />
        <Route path="page-editor" element={<PageEditor />} />
        <Route path="subscribers" element={<Subscribers />} />
        <Route path="plans" element={<Plans />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="support" element={<Support />} />
        <Route path="affiliates" element={<Affiliates />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
