import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export function useEvents() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['seasonal-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['event-participations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('event_participations')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const joinEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ eventId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to join event');
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueriesData({ queryKey: ['profile'] }, (old: any) => {
        if (old && data?.new_balance !== undefined) {
          return { ...old, raw_points: data.new_balance };
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['event-participations'] });
      queryClient.invalidateQueries({ queryKey: ['seasonal-events'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const isParticipating = (eventId: string) => {
    return participations.some((p: any) => p.event_id === eventId);
  };

  return {
    events,
    participations,
    isLoading,
    joinEvent,
    isParticipating,
  };
}
