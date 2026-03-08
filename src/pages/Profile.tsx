import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { useBadges } from '@/hooks/useBadges';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/providers/AuthProvider';
import { AdvancedReferralCard } from '@/components/referral/AdvancedReferralCard';
import { MultiWalletCard } from '@/components/wallet/MultiWalletCard';
import { useTonWalletContext } from '@/hooks/useTonWallet';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { 
  Calendar, Trophy, Package, ListTodo, Wallet, 
  Sparkles, Shield, Zap, LogOut, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const { profile, leaderboardEntry, totalMultiplier, isAuthenticated, isLoading } = useProfile();
  const { user } = useTelegram();
  const { signOut } = useAuth();
  const { badgeCount, userBadges, badgesByCategory } = useBadges();
  const { isConnected: tonConnected } = useTonWalletContext();
  const { connectedWallets } = useMultiWallet();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  const walletBadges = badgesByCategory.wallet || [];
  const ownedWalletBadgeIds = new Set(userBadges.filter(ub => ub.badge?.badge_category === 'wallet').map(ub => ub.badge_id));
  const totalWalletsConnected = (tonConnected ? 1 : 0) + connectedWallets.filter(w => w.type !== 'ton').length;

  const stats = [
    { 
      icon: <Trophy className="w-5 h-5 text-yellow-500" />,
      label: 'Rank',
      value: leaderboardEntry?.rank_all_time ? `#${leaderboardEntry.rank_all_time.toLocaleString()}` : '---'
    },
    { 
      icon: <span className="text-lg">🏆</span>,
      label: 'Badges',
      value: badgeCount.toString()
    },
    { 
      icon: <Package className="w-5 h-5 text-purple-500" />,
      label: 'Boxes Opened',
      value: (profile?.total_boxes_opened || 0).toString()
    },
    { 
      icon: <ListTodo className="w-5 h-5 text-blue-500" />,
      label: 'Tasks Done',
      value: (profile?.total_tasks_completed || 0).toString()
    },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 text-center max-w-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
            <p className="text-muted-foreground text-sm">
              Please sign in to access your profile.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const displayName = profile?.first_name || user?.first_name || 'Farmer';
  const displayUsername = profile?.username || user?.username || profile?.ref_code || 'anonymous';

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 pb-24">
        {/* Profile header */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarImage src={user?.photo_url} />
              <AvatarFallback className="text-3xl bg-primary/20">
                {displayName[0]?.toUpperCase() || '🌾'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">@{displayUsername}</p>
              {profile?.created_at && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {formatDate(profile.created_at)}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  {totalMultiplier.toFixed(1)}× Multiplier
                </div>
                {totalWalletsConnected > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-medium"
                  >
                    <Wallet className="w-3 h-3" />
                    {totalWalletsConnected} Wallet{totalWalletsConnected > 1 ? 's' : ''}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex-1 border-primary/50 text-primary"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  {stat.icon}
                  <span className="text-xs">{stat.label}</span>
                </div>
                <span className="text-2xl font-bold">{stat.value}</span>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallet">Wallets</TabsTrigger>
            <TabsTrigger value="referral">Referrals</TabsTrigger>
            <TabsTrigger value="multiplier">Multiplier</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-4 space-y-4">
            <MultiWalletCard />
            
            {/* Wallet Badges */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Wallet Badges
                {totalWalletsConnected === 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Connect wallet to unlock
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {walletBadges.map((badge) => {
                  const isOwned = ownedWalletBadgeIds.has(badge.id);
                  const isLocked = totalWalletsConnected === 0 && !isOwned;
                  
                  return (
                    <motion.div
                      key={badge.id}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all',
                        isOwned 
                          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50' 
                          : isLocked
                          ? 'bg-muted/20 border-muted/30 opacity-50'
                          : 'bg-muted/30 border-muted/50'
                      )}
                      whileHover={!isLocked ? { scale: 1.02 } : {}}
                    >
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-sm">
                          <div className="text-center">
                            <Wallet className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Connect Wallet</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-3xl",
                          !isOwned && !isLocked && "grayscale opacity-60"
                        )}>
                          {badge.icon_emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{badge.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              isOwned 
                                ? "bg-primary/20 text-primary" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              {badge.multiplier.toFixed(1)}×
                            </span>
                            <span className={cn(
                              "text-[10px] uppercase",
                              isOwned ? "text-primary" : "text-muted-foreground"
                            )}>
                              {badge.rarity}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isOwned && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center"
                        >
                          <span className="text-[10px]">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              {walletBadges.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No wallet badges available yet.
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="referral" className="mt-4">
            <AdvancedReferralCard />
          </TabsContent>

          <TabsContent value="multiplier" className="mt-4">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Multiplier Breakdown
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Base Multiplier</span>
                  <span className="font-medium">1.0×</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-muted-foreground">From Badges</span>
                  </div>
                  <span className="font-medium text-primary">
                    +{((totalMultiplier - 1) > 0 ? (totalMultiplier - 1).toFixed(1) : '0.0')}×
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="text-muted-foreground">Streak Bonus</span>
                  </div>
                  <span className="font-medium text-accent">
                    +{(profile?.streak_current || 0) >= 7 ? '0.1' : '0.0'}×
                  </span>
                </div>
                {totalWalletsConnected > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center justify-between py-2 border-b border-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👛</span>
                      <span className="text-muted-foreground">Wallets ({totalWalletsConnected})</span>
                    </div>
                    <span className="font-medium text-success">
                      +{(totalWalletsConnected * 0.05).toFixed(2)}×
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Total Multiplier</span>
                  <motion.span 
                    key={totalMultiplier}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-primary"
                  >
                    {totalMultiplier.toFixed(1)}×
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your multiplier is applied to all points earned from boxes and tasks.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
