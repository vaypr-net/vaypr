import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Google OAuth Callback Handler
 * 
 * This page is shown when Google redirects back to our app
 * URL: /auth/callback?token=JWT_TOKEN
 * 
 * Flow:
 * 1. Extract JWT token from URL params
 * 2. Store token in localStorage
 * 3. Update auth context
 * 4. Redirect to dashboard
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');

      if (!token) {
        // No token found - redirect to login with error
        navigate('/login?error=auth_failed');
        return;
      }

      try {
        // Store token in localStorage
        localStorage.setItem('accessToken', token);

        // Decode token to get userId (JWT payload is base64 encoded)
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        const userId = payload?.sub;
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

        // Fetch both core user record and the userprofile, then merge
        const [userRes, profileRes] = await Promise.all([
          fetch(`${apiBaseUrl}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${apiBaseUrl}/userprofile`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!userRes.ok) throw new Error('Failed to fetch user record');
        if (!profileRes.ok) throw new Error('Failed to fetch user profile');

        const userRecord = await userRes.json();
        const profile = await profileRes.json();

        // Merge into a single user object shape expected by the frontend
        const merged = {
          id: userRecord._id || userRecord.id || userRecord._id,
          email: profile?.email || userRecord.email,
          fullName: profile?.fullName || userRecord.fullName || userRecord.name,
          name: profile?.fullName || userRecord.fullName || userRecord.name,
          avatar: userRecord.profilePicture || profile?.profileImage || userRecord.profileImage || null,
          isSuperAdmin: profile?.isSuperAdmin || userRecord.isSuperAdmin || false,
          createdAt: userRecord.createdAt,
        };

        localStorage.setItem('user', JSON.stringify(merged));
        updateUser(merged as any);

        // Redirect based on user role
        if (merged.isSuperAdmin) {
          navigate('/super-admin');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        localStorage.removeItem('accessToken');
        navigate('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we log you in</p>
      </div>
    </div>
  );
}
