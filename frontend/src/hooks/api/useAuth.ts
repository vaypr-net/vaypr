import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/api/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';

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
        createdAt: new Date().toISOString(),
      };
      
      updateUser(user as any);
      
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.fullName}`,
      });
      
      window.location.href = '/dashboard';
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
        createdAt: new Date().toISOString(),
      };
      
      updateUser(user as any);
      
      // Show success message
      toast({
        title: 'Welcome to VAYPR!',
        description: `Account created successfully. Welcome, ${data.user.fullName}!`,
      });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
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
