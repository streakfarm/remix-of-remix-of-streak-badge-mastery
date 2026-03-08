import { motion, AnimatePresence } from 'framer-motion';
import { useReferralTiers } from '@/hooks/useReferralTiers';
import { useReferrals } from '@/hooks/useReferrals';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Copy, Share2, Gift, Sparkles, Coins, Clock, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function AdvancedReferralCard() {
  const { profile } = useProfile();
  const { tiers, currentTier, nextTier, progressToNext, totalReferrals } = useReferralTiers();
  const { referrals, totalEarned, referredBy } = useReferrals();
  const { hapticFeedback, shareRef } = useTelegram();

  const refCode = profile?.ref_code || '';
  const shareUrl = isTelegram 
    ? `https://t.me/StreakFarmBot?start=${refCode}`
    : `${window.location.origin}?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    hapticFeedback('selection');
    toast.success('Referral link copied! 📋');
  };

  const handleShare = () => {
    hapticFeedback('medium');
    if (navigator.share) {
      navigator.share({
        title: 'Join StreakFarm!',
        text: '🔥 Join StreakFarm and earn points! Use my referral link:',
        url: shareUrl,
      }).catch(() => {});
    } else {
      shareRef(refCode);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <Users className="w-5 h-5 text-secondary mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalReferrals}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Invited</p>
        </Card>
        <Card className="p-3 text-center">
          <Coins className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalEarned.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
        </Card>
        <Card className="p-3 text-center">
          <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold">{currentTier?.icon_emoji || '🎯'}</p>
          <p className="text-[10px] text-muted-foreground uppercase truncate">{currentTier?.name || 'None'}</p>
        </Card>
      </div>

      {/* Share card */}
      <Card className="p-5 bg-gradient-to-br from-secondary/10 via-card to-primary/5 border-secondary/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Invite Friends</h3>
            <p className="text-xs text-muted-foreground">
              You get +100 pts • Friend gets +50 pts
            </p>
          </div>
        </div>

        {/* Ref link */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-xs font-mono text-muted-foreground truncate border border-border">
            {shareUrl}
          </div>
          <motion.button
            onClick={handleCopy}
            className="px-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        <motion.button
          onClick={handleShare}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-secondary-foreground font-bold text-sm flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Share2 className="w-4 h-4" />
          Share Referral Link
        </motion.button>
      </Card>

      {/* Referred by */}
      {referredBy && (
        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-medium">Referred by</p>
              <p className="text-xs text-muted-foreground">
                {referredBy.first_name || referredBy.username || 'A friend'}
              </p>
            </div>
            <span className="ml-auto text-xs font-bold text-success">+50 pts earned</span>
          </div>
        </Card>
      )}

      {/* Current tier + progress */}
      {currentTier && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentTier.icon_emoji}</span>
              <div>
                <h4 className="font-bold text-sm">{currentTier.name}</h4>
                <p className="text-[10px] text-muted-foreground">
                  +{currentTier.multiplier_bonus}× multiplier bonus
                </p>
              </div>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next: {nextTier.name}</p>
                <p className="text-xs font-bold text-primary">
                  {nextTier.min_referrals - totalReferrals} more needed
                </p>
              </div>
            )}
          </div>

          {nextTier && (
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Referral history */}
      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-secondary" />
          Recent Referrals
          {referrals.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{referrals.length} total</span>
          )}
        </h4>

        {referrals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No referrals yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Share your link to start earning!
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {referrals.slice(0, 20).map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/50"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={referral.referee_avatar || undefined} />
                  <AvatarFallback className="text-xs bg-secondary/20">
                    {(referral.referee_first_name || referral.referee_username || '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {referral.referee_first_name || referral.referee_username || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(referral.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-primary">+{referral.referrer_bonus}</span>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Tier roadmap */}
      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Referral Tiers
        </h4>

        <div className="space-y-2">
          {tiers.map((tier: any, index: number) => {
            const isUnlocked = totalReferrals >= tier.min_referrals;
            const isCurrent = currentTier?.id === tier.id;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  isCurrent
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30'
                    : isUnlocked
                    ? 'bg-success/5 border-success/20'
                    : 'bg-muted/20 border-border opacity-60'
                )}
              >
                <span className={cn('text-xl', !isUnlocked && 'grayscale')}>{tier.icon_emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tier.name}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {tier.min_referrals} referrals • +{tier.bonus_points.toLocaleString()} pts • +{tier.multiplier_bonus}× boost
                  </p>
                </div>
                {isUnlocked && (
                  <span className="text-success text-xs font-bold">✓</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
