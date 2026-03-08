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
      if (!profile?.id) throw new Error('No profile');
      const { data, error } = await supabase
        .from('event_participations')
        .insert({ event_id: eventId, user_id: profile.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-participations'] });
      queryClient.invalidateQueries({ queryKey: ['seasonal-events'] });
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
