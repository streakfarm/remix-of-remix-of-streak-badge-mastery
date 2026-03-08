import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface Referral {
  id: string;
  referee_id: string;
  referrer_bonus: number;
  referee_bonus: number;
  is_valid: boolean;
  created_at: string;
  referee_username?: string;
  referee_first_name?: string;
  referee_avatar?: string;
}

export function useReferrals() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  // Fetch referrals I made (people I invited)
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['my-referrals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select('id, referee_id, referrer_bonus, referee_bonus, is_valid, created_at')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch referee profiles
      if (data && data.length > 0) {
        const refereeIds = data.map(r => r.referee_id);
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('id, username, first_name, avatar_url')
          .in('id', refereeIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return data.map(r => ({
          ...r,
          referee_username: profileMap.get(r.referee_id)?.username || undefined,
          referee_first_name: profileMap.get(r.referee_id)?.first_name || undefined,
          referee_avatar: profileMap.get(r.referee_id)?.avatar_url || undefined,
        })) as Referral[];
      }

      return data as Referral[];
    },
    enabled: !!profile?.id,
  });

  // Check if current user was referred
  const { data: referredBy } = useQuery({
    queryKey: ['referred-by', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !profile?.referred_by) return null;

      const { data } = await supabase
        .from('profiles_public')
        .select('id, username, first_name, avatar_url')
        .eq('id', profile.referred_by)
        .maybeSingle();

      return data;
    },
    enabled: !!profile?.id && !!profile?.referred_by,
  });

  // Process a referral code (for web users)
  const processReferral = useMutation({
    mutationFn: async (refCode: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-referral`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ref_code: refCode }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        if (result.already_referred) return { already_referred: true };
        throw new Error(result.error || 'Failed to process referral');
      }
      return result;
    },
    onSuccess: (data) => {
      if (data && !data.already_referred) {
        toast.success(`🎉 Referral applied! You earned +${data.referee_bonus} bonus points!`);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
      }
    },
    onError: (error: Error) => {
      if (!error.message.includes('Already referred')) {
        toast.error(error.message);
      }
    },
  });

  const totalEarned = referrals.reduce((sum, r) => sum + (r.referrer_bonus || 0), 0);

  return {
    referrals,
    referredBy,
    totalEarned,
    isLoading,
    processReferral,
  };
}
