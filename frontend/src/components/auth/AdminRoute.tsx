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
  const { user } = useAuth();

  // DEBUG
  console.log('🔐 AdminRoute CHECK:', {
    user: user,
    isSuperAdmin: user?.isSuperAdmin,
    type: typeof user?.isSuperAdmin,
    isTrue: user?.isSuperAdmin === true,
    condition: !user || !user.isSuperAdmin,
    willRedirect: !user || !user.isSuperAdmin,
  });

  // If not authenticated or not super admin, redirect to dashboard
  if (!user || !user.isSuperAdmin) {
    console.log('❌ AdminRoute: Redirecting to /dashboard (not super admin)');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ AdminRoute: Allowing access to admin panel');
  // User is super admin, render the protected route
  return <>{children}</>;
}
