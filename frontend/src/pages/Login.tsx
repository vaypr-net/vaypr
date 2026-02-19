import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
// removed useLogin in favor of manual login flow to support 2FA
import { AuthService } from '@/api/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '@/api/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [is2FAPromptOpen, setIs2FAPromptOpen] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await AuthService.login({ email, password });
      if (res.two_factor_required) {
        setTempToken(res.temp_token);
        setIs2FAPromptOpen(true);
        return;
      }

      // Successful login flow (no 2FA)
      localStorage.setItem('accessToken', res.access_token);
      const user = {
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName,
        name: res.user.fullName,
        createdAt: new Date().toISOString(),
        isSuperAdmin: res.user.isSuperAdmin || false,
      };
      updateUser(user as any);
      toast({ title: 'Welcome back!', description: `Logged in as ${res.user.fullName}` });
      const from = (location.state as any)?.from || null;
      if (from) navigate(from, { replace: true });
      else if (res.user.isSuperAdmin) navigate('/super-admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      toast({ title: 'Login failed', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!tempToken) return;
    setVerifying2FA(true);
    try {
      const response = await axios.post('/auth/2fa/verify', { token: twoFACode }, { headers: { Authorization: `Bearer ${tempToken}` } });
      const data = response.data;
      // Should return access_token and user
      localStorage.setItem('accessToken', data.access_token);
      const user = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        name: data.user.fullName,
        createdAt: new Date().toISOString(),
      };
      updateUser(user as any);
      toast({ title: 'Logged in', description: 'Two-factor authentication successful' });
      setIs2FAPromptOpen(false);
      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: '2FA failed', description: err.response?.data?.message || 'Invalid code', variant: 'destructive' });
    } finally {
      setVerifying2FA(false);
    }
  };

  /**
   * Google OAuth Login Handler
   * 
   * Redirects user to backend Google OAuth route
   * Backend handles entire OAuth flow:
   * 1. Redirects to Google
   * 2. User authorizes
   * 3. Google redirects back to backend
   * 4. Backend creates/links user account
   * 5. Backend redirects to frontend with JWT token
   * 6. Frontend callback page handles token storage
   */
  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-xl font-display">V</span>
            </div>
            <span className="font-display font-bold text-2xl text-white">VAYPR</span>
          </Link>
          
          <div className="space-y-6">
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight">
              Simplify your financial management
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Create invoices, track expenses, and manage clients all in one beautiful platform.
            </p>
          </div>
          
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} VAYPR. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display">V</span>
            </div>
            <span className="font-display font-bold text-lg">VAYPR</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-md border-0 shadow-none lg:shadow-card lg:border">
            <CardHeader className="text-center pb-2">
              <div className="hidden lg:flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                  <span className="text-primary-foreground font-bold text-xl font-display">V</span>
                </div>
              </div>
              <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your VAYPR account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 gap-3 font-medium"
                onClick={handleGoogleLogin}
                disabled={submitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-glow" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
              <Dialog open={is2FAPromptOpen} onOpenChange={setIs2FAPromptOpen}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Two-Factor Verification</DialogTitle>
                    <DialogDescription>Enter the 6-digit code from your authenticator app</DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                    <Input value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="123456" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIs2FAPromptOpen(false)}>Cancel</Button>
                    <Button onClick={handleVerify2FA} disabled={verifying2FA}>{verifying2FA ? 'Verifying...' : 'Verify'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}