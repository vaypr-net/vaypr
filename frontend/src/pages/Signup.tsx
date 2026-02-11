import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSignup } from '@/hooks/api/useAuth';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { toast } = useToast();
  const signupMutation = useSignup();

  // Validation helpers
  const validateFullName = (name: string): string | undefined => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters';
    if (name.trim().length > 50) return 'Full name must not exceed 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (pwd: string): string | undefined => {
    if (!pwd) return 'Password is required';
    if (pwd.length < 6) return 'Password must be at least 6 characters';
    if (pwd.length > 100) return 'Password must not exceed 100 characters';
    return undefined;
  };

  const validateConfirmPassword = (pwd: string, confirm: string): string | undefined => {
    if (!confirm) return 'Please confirm your password';
    if (pwd !== confirm) return 'Passwords do not match';
    return undefined;
  };

  // Real-time validation on blur
  const handleFullNameBlur = () => {
    setErrors(prev => ({ ...prev, fullName: validateFullName(fullName) }));
  };

  const handleEmailBlur = () => {
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
    // Re-validate confirm password if it has a value
    if (confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(password, confirmPassword) }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(password, confirmPassword) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    setErrors({
      fullName: fullNameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    // If any validation fails, stop submission
    if (fullNameError || emailError || passwordError || confirmPasswordError) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        variant: 'destructive',
      });
      return;
    }

    // Submit to backend
    signupMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  };

  /**
   * Google OAuth Signup Handler
   * 
   * Same flow as login - redirects to backend Google OAuth
   * Backend handles:
   * 1. Check if user exists
   * 2. If exists: Link Google account
   * 3. If not: Create new Google user
   * 4. Issue JWT token
   * 5. Redirect to frontend callback
   */
  const handleGoogleSignup = () => {
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
              Start managing your finances today
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Join thousands of businesses using VAYPR to simplify invoicing, expense tracking, and client management.
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
              <CardTitle className="font-display text-2xl">Create an account</CardTitle>
              <CardDescription>Get started with VAYPR for free</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 gap-3 font-medium"
                onClick={handleGoogleSignup}
                disabled={signupMutation.isPending}
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
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                      }}
                      onBlur={handleFullNameBlur}
                      required
                      className={`h-11 pr-10 ${errors.fullName ? 'border-destructive' : fullName && !errors.fullName ? 'border-green-500' : ''}`}
                    />
                    {fullName && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.fullName ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                      }}
                      onBlur={handleEmailBlur}
                      required
                      className={`h-11 pr-10 ${errors.email ? 'border-destructive' : email && !errors.email ? 'border-green-500' : ''}`}
                    />
                    {email && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.email ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                        if (confirmPassword && errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      onBlur={handlePasswordBlur}
                      required
                      className={`h-11 pr-10 ${errors.password ? 'border-destructive' : password && !errors.password ? 'border-green-500' : ''}`}
                    />
                    {password && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.password ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                  {password && !errors.password && (
                    <p className="text-xs text-green-600">Strong password ✓</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }}
                      onBlur={handleConfirmPasswordBlur}
                      required
                      className={`h-11 pr-10 ${errors.confirmPassword ? 'border-destructive' : confirmPassword && !errors.confirmPassword && password === confirmPassword ? 'border-green-500' : ''}`}
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.confirmPassword ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : password === confirmPassword ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                  {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-600">Passwords match ✓</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-glow" disabled={signupMutation.isPending}>
                  {signupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}