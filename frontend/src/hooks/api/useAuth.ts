import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/api/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const QUERY_KEY = 'auth';

// Clean up old localStorage keys from previous fake auth system
function cleanupOldLocalStorage() {
  const keysToRemove: string[] = [];
  
  // Find all keys that start with 'fintrack_'
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fintrack_')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all old keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log(`🧹 Cleaned up ${keysToRemove.length} old localStorage keys`);
}

export function useLogin() {
  const { toast } = useToast();
  const { updateUser } = useAuthContext();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      // Clean up old localStorage keys
      cleanupOldLocalStorage();
      
      localStorage.setItem('accessToken', data.access_token);
      
      // Map backend user to frontend User type
      const user = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        name: data.user.fullName, // For backwards compatibility with UI components
        createdAt: new Date().toISOString(),
        isSuperAdmin: data.user.isSuperAdmin || false,
      };
      
      updateUser(user as any);
      
      // DEBUG: Log the response data
      console.log('🔐 FRONTEND LOGIN DEBUG:', {
        rawData: data,
        dataUserIsSuperAdmin: data.user.isSuperAdmin,
        type: typeof data.user.isSuperAdmin,
        user: user,
      });
      
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.fullName}`,
      });
      
      // Redirect based on user role
      console.log('🔄 REDIRECT CHECK:', {
        isSuperAdmin: data.user.isSuperAdmin,
        condition: data.user.isSuperAdmin === true,
        redirectTo: data.user.isSuperAdmin ? '/super-admin' : '/dashboard',
      });
      
      if (data.user.isSuperAdmin) {
        console.log('✅ Redirecting to /super-admin');
        navigate('/super-admin', { replace: true });
      } else {
        console.log('❌ Redirecting to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      toast({
        title: 'Login failed',
        description: Array.isArray(errorMessage) 
          ? errorMessage.join(', ') 
          : errorMessage || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useSignup() {
  const { toast } = useToast();
  const { updateUser } = useAuthContext();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: AuthService.signup,
    onSuccess: (data) => {
      // Clean up old localStorage keys
      cleanupOldLocalStorage();
      
      // Store token
      localStorage.setItem('accessToken', data.access_token);
      
      // Map and store user data
      const user = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        name: data.user.fullName, // For backwards compatibility with UI components
        createdAt: new Date().toISOString(),
        isSuperAdmin: data.user.isSuperAdmin || false,
      };
      
      updateUser(user as any);
      
      // Show success message
      toast({
        title: 'Welcome to VAYPR!',
        description: `Account created successfully. Welcome, ${data.user.fullName}!`,
      });
      
      // Redirect based on user role
      if (data.user.isSuperAdmin) {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      toast({
        title: 'Signup failed',
        description: Array.isArray(errorMessage) 
          ? errorMessage.join(', ') 
          : errorMessage || 'Could not create account. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: [QUERY_KEY, 'profile'],
    queryFn: AuthService.getProfile,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateUser } = useAuthContext();

  return useMutation({
    mutationFn: AuthService.updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'profile'] });
      // Update user in context and localStorage
      updateUser(data as any);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    },
  });
}
