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

        // Decode token to get user info (JWT payload is base64 encoded)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Fetch user data from backend using token
        const response = await fetch('http://localhost:8081/userprofile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          updateUser(userData);
          
          // Redirect based on user role
          if (userData.isSuperAdmin) {
            navigate('/super-admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          throw new Error('Failed to fetch user data');
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
