import { useState } from 'react';
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
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AuthService } from '@/api/services/auth.service';

export default function SuperAdminResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token') || '';
  const hasToken = Boolean(token);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

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
      await AuthService.superAdminResetPassword({ token, newPassword });
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
      {/* Left branding panel */}
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
              Secure your corporate account
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Set a strong new password. All active sessions will be revoked immediately.
            </p>
          </div>
          <p className="text-white/60 text-sm">Copyright © VAYPR™ , All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b border-border">
          <Link to="/corporate/login" className="flex items-center gap-2">
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
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-display">
                {isDone ? 'Password Updated' : 'Set New Corporate Password'}
              </CardTitle>
              <CardDescription>
                {isDone
                  ? 'Your password has been changed and all active sessions have been revoked.'
                  : 'Choose a strong password. All existing sessions will be logged out immediately.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {!hasToken ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-destructive">
                    This link is invalid or has already been used.
                  </p>
                  <Link
                    to="/super-admin/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Request a new reset link
                  </Link>
                </div>
              ) : isDone ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90"
                    onClick={() => navigate('/corporate/login')}
                  >
                    Go to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
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
                    Reset Password & Revoke All Sessions
                  </Button>
                </form>
              )}
            </CardContent>

            {!isDone && (
              <CardFooter className="flex flex-col gap-2 pt-2">
                <Link
                  to="/corporate/login"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to corporate login
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
