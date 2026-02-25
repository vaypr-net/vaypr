import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Admin Route Wrapper
 * 
 * Protects super admin routes from unauthorized access
 * Only users with isSuperAdmin = true can access wrapped routes
 * 
 * Usage:
 *   <Route path="/super-admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
 *     <Route path="overview" element={<Overview />} />
 *     ...
 *   </Route>
 * 
 * How it works:
 * - Checks if user is authenticated
 * - Checks if user has isSuperAdmin flag
 * - Redirects to /dashboard if not super admin
 */
interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();

  // While auth is being initialized from localStorage, show loading
  if (isLoading) {
    console.log('🔐 AdminRoute: waiting for auth to initialize');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // DEBUG
  console.log('🔐 AdminRoute CHECK:', {
    user: user,
    isSuperAdmin: user?.isSuperAdmin,
    type: typeof user?.isSuperAdmin,
    isTrue: user?.isSuperAdmin === true,
    condition: !user || !user.isSuperAdmin,
    willRedirect: !user || !user.isSuperAdmin,
  });

  if (!user) {
    console.log('❌ AdminRoute: Redirecting to /super-admin/login (not authenticated)');
    return <Navigate to="/super-admin/login" replace />;
  }

  if (!user.isSuperAdmin) {
    console.log('❌ AdminRoute: Redirecting to /dashboard (not super admin)');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ AdminRoute: Allowing access to admin panel');
  // User is super admin, render the protected route
  return <>{children}</>;
}
