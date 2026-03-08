import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event from the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Password updated! 🔐');
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mobile-vh bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--secondary) / 0.15), transparent)' }}
          animate={{ scale: [1.3, 1, 1.3], x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary mb-4"
            animate={{
              boxShadow: [
                '0 0 30px hsl(var(--primary) / 0.3)',
                '0 0 60px hsl(var(--primary) / 0.5)',
                '0 0 30px hsl(var(--primary) / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-5xl">{success ? '✅' : '🔐'}</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-1">
            {success ? 'Password Updated!' : 'New Password'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {success ? 'Redirecting to dashboard...' : 'Choose a strong new password'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 card-glow">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <CheckCircle className="w-16 h-16 mx-auto text-primary" />
              <p className="text-foreground font-medium">Password successfully changed</p>
              <p className="text-muted-foreground text-sm">Taking you back to the app...</p>
            </motion.div>
          ) : !isRecovery ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Invalid or expired reset link. Please request a new one.
              </p>
              <motion.button
                onClick={() => navigate('/forgot-password')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Request New Link
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  required
                  minLength={6}
                />
              </div>

              {/* Password strength hints */}
              <div className="space-y-1">
                <div className={`flex items-center gap-2 text-xs ${password.length >= 6 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  At least 6 characters
                </div>
                <div className={`flex items-center gap-2 text-xs ${password === confirmPassword && password.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  Passwords match
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
