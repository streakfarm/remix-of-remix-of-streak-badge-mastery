import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export function useReferralTiers() {
  const { profile } = useProfile();
  const totalReferrals = profile?.total_referrals || 0;

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['referral-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_tiers')
        .select('*')
        .order('min_referrals', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const currentTier = tiers.reduce((best: any, tier: any) => {
    if (totalReferrals >= tier.min_referrals) return tier;
    return best;
  }, null);

  const nextTier = tiers.find((t: any) => t.min_referrals > totalReferrals) || null;

  const progressToNext = nextTier
    ? Math.min(100, ((totalReferrals - (currentTier?.min_referrals || 0)) / (nextTier.min_referrals - (currentTier?.min_referrals || 0))) * 100)
    : 100;

  return {
    tiers,
    currentTier,
    nextTier,
    progressToNext,
    totalReferrals,
    isLoading,
  };
}
