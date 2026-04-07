import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AuthService } from '@/api/services/auth.service';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // If there's no token in URL at all, show an error card immediately
  const hasToken = Boolean(token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Invalid link',
        description: 'Reset link is missing or expired. Please request a new one.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.resetPassword({ token, newPassword });
      setIsDone(true);
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description:
          err.response?.data?.message ||
          'This reset link is invalid or has expired. Please request a new one.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — branding (same as Login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
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
              Secure your account
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Create a strong new password to protect your VAYPR account.
            </p>
          </div>
          <p className="text-white/60 text-sm">Copyright © VAYPR™ , All rights reserved.</p>
        </div>
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-border">
          <Link to="/login" className="flex items-center gap-2">
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
              <CardTitle className="font-display text-2xl">
                {isDone ? 'Password updated!' : 'Set new password'}
              </CardTitle>
              <CardDescription>
                {isDone
                  ? 'Your password has been reset successfully.'
                  : hasToken
                  ? 'Enter your new password below.'
                  : 'This reset link is invalid or has expired.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* ── Success state ── */}
              {isDone && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                  <p className="text-sm text-muted-foreground text-center">
                    You can now sign in with your new password.
                  </p>
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 shadow-glow"
                    onClick={() => navigate('/login', { replace: true })}
                  >
                    Go to Sign In
                  </Button>
                </div>
              )}

              {/* ── Invalid / missing token state ── */}
              {!isDone && !hasToken && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Please request a new password reset link from the login page.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => navigate('/login', { replace: true })}
                  >
                    Back to Sign In
                  </Button>
                </div>
              )}

              {/* ── Reset form ── */}
              {!isDone && hasToken && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 shadow-glow"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              )}
            </CardContent>

            {!isDone && hasToken && (
              <CardFooter className="pt-2">
                <p className="text-sm text-muted-foreground text-center w-full">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
