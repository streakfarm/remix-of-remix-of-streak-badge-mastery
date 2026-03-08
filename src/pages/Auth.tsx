import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Gift } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Capture ref code from URL
  const refCode = searchParams.get('ref') || '';

  // If ref code present, default to signup
  useEffect(() => {
    if (refCode) {
      setIsLogin(false);
    }
  }, [refCode]);

  // Store ref code in localStorage so we can process after signup
  useEffect(() => {
    if (refCode) {
      localStorage.setItem('pending_ref_code', refCode);
    }
  }, [refCode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back! 🔥');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, first_name: username },
          },
        });
        if (error) throw error;
        toast.success('Account created! Welcome to StreakFarm 🎉');

        // Process referral after signup
        const pendingRef = localStorage.getItem('pending_ref_code');
        if (pendingRef) {
          // Small delay to let profile be created by trigger
          setTimeout(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const response = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-referral`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ ref_code: pendingRef }),
                  }
                );
                const result = await response.json();
                if (response.ok && result.success) {
                  toast.success(`🎁 Referral bonus: +${result.referee_bonus} points!`);
                }
              }
            } catch (err) {
              console.error('Referral processing error:', err);
            } finally {
              localStorage.removeItem('pending_ref_code');
            }
          }, 2000);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mobile-vh bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15), transparent)' }}
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--secondary) / 0.15), transparent)' }}
          animate={{ scale: [1.3, 1, 1.3], x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.08), transparent)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Content */}
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
            <motion.span
              className="text-5xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🔥
            </motion.span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-1">StreakFarm</h1>
          <p className="text-muted-foreground text-sm">Earn points, collect badges, climb the leaderboard</p>
        </div>

        {/* Referral Banner */}
        {refCode && !isLogin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
              <Gift className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold">You've been invited! 🎉</p>
              <p className="text-xs text-muted-foreground">
                Sign up now to get <strong className="text-primary">+50 bonus points</strong>
              </p>
            </div>
          </motion.div>
        )}

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-6 card-glow">
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isLogin ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !isLogin ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {isLogin && (
              <Link
                to="/forgot-password"
                className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
              >
                Forgot password?
              </Link>
            )}
          </form>

          {/* Bonus info */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span>
                Get <strong className="text-primary">{refCode ? '550' : '500'} bonus points</strong> on signup!
                {refCode && <span className="text-secondary"> (incl. referral bonus)</span>}
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '🏆', label: 'Leaderboards' },
            { emoji: '🎁', label: 'Daily Boxes' },
            { emoji: '💎', label: 'NFT Badges' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
