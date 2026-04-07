import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AuthService } from '@/api/services/auth.service';

export default function SuperAdminForgotPassword() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleRequest = async () => {
    setIsSubmitting(true);
    try {
      await AuthService.superAdminForgotPassword();
      setIsDone(true);
    } catch {
      // Always show the same success UI to avoid leaking whether an admin exists
      setIsDone(true);
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
              Corporate Control Center
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Secure password recovery for authorized administrators only.
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
                  <ShieldAlert className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-display">
                {isDone ? 'Check your inbox' : 'Recover Admin Access'}
              </CardTitle>
              <CardDescription>
                {isDone
                  ? 'If the admin account is eligible, a reset link has been sent to the registered email address.'
                  : 'A password reset link will be sent to the registered super admin email address. No email input is required.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {isDone ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <p className="text-sm text-muted-foreground text-center">
                    The link expires in <strong>15 minutes</strong>. Check your spam folder if you
                    don't see it.
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full h-11 bg-primary hover:bg-primary/90 shadow-glow"
                  onClick={handleRequest}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
              <Link
                to="/corporate/login"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to corporate login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
