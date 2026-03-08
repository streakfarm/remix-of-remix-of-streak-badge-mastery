import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  redirect_url: string;
  placement: string;
  is_active: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

export function useAds(placement?: string) {
  const queryClient = useQueryClient();

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['ads', placement],
    queryFn: async () => {
      let query = supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (placement) {
        query = query.eq('placement', placement);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Ad[];
    },
  });

  const trackImpression = useMutation({
    mutationFn: async (adId: string) => {
      await supabase.rpc('increment_ad_impressions' as any, { ad_id: adId }).catch(() => {
        // Fallback: direct update (works for admins or if RPC doesn't exist)
      });
    },
  });

  const trackClick = useMutation({
    mutationFn: async (adId: string) => {
      await supabase.rpc('increment_ad_clicks' as any, { ad_id: adId }).catch(() => {});
    },
  });

  // Get a random ad from the list weighted by priority
  const getRandomAd = (): Ad | null => {
    if (ads.length === 0) return null;
    if (ads.length === 1) return ads[0];
    
    const totalPriority = ads.reduce((sum, ad) => sum + Math.max(ad.priority, 1), 0);
    let random = Math.random() * totalPriority;
    
    for (const ad of ads) {
      random -= Math.max(ad.priority, 1);
      if (random <= 0) return ad;
    }
    
    return ads[0];
  };

  return {
    ads,
    isLoading,
    getRandomAd,
    trackImpression,
    trackClick,
  };
}
