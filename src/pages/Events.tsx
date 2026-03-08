import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents } from '@/hooks/useEvents';
import { useTelegram } from '@/hooks/useTelegram';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Zap, Clock, Check, Trophy, Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function Events() {
  const { events, participations, isParticipating, joinEvent, isLoading } = useEvents();
  const { hapticFeedback } = useTelegram();

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 pb-24">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-3"
          >
            <span className="text-4xl">🎪</span>
          </motion.div>
          <h1 className="text-2xl font-bold">Events & Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join live events for bonus rewards & exclusive badges
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-32 rounded-xl skeleton-gaming" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-bold text-lg mb-1">No Active Events</h3>
            <p className="text-sm text-muted-foreground">
              Check back soon for exciting events and campaigns!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event: any, index: number) => (
              <EventFullCard
                key={event.id}
                event={event}
                isJoined={isParticipating(event.id)}
                participation={participations.find((p: any) => p.event_id === event.id)}
                onJoin={() => {
                  hapticFeedback('medium');
                  joinEvent.mutate(event.id, {
                    onSuccess: () => {
                      hapticFeedback('success');
                      toast.success(`🎉 Joined "${event.name}"!`);
                    },
                  });
                }}
                index={index}
                isJoining={joinEvent.isPending}
              />
            ))}
          </div>
        )}

        {/* Past events section placeholder */}
        <div className="pt-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Completed Events
          </h3>
          <Card className="p-6 text-center border-dashed">
            <p className="text-sm text-muted-foreground">Past events will appear here</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function EventFullCard({
  event,
  isJoined,
  participation,
  onJoin,
  index,
  isJoining,
}: {
  event: any;
  isJoined: boolean;
  participation?: any;
  onJoin: () => void;
  index: number;
  isJoining: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const end = new Date(event.end_date).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [event.end_date]);

  const rewards = event.rewards || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        {/* Header with gradient */}
        <div className={cn(
          'p-5 bg-gradient-to-r',
          event.event_type === 'referral'
            ? 'from-secondary/20 via-primary/10 to-accent/20'
            : 'from-primary/20 via-accent/10 to-secondary/20'
        )}>
          <div className="flex items-start gap-4">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center text-3xl flex-shrink-0"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {event.icon_emoji}
            </motion.div>

            <div className="flex-1">
              <h3 className="font-bold text-lg">{event.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{event.description}</p>

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {timeLeft} left
                </div>
                {event.bonus_multiplier > 1 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                    <Zap className="w-3 h-3" />
                    {event.bonus_multiplier}× Points
                  </div>
                )}
                {event.current_participants > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {event.current_participants} joined
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards section */}
        <div className="p-4 space-y-3">
          {rewards.bonus_points && (
            <div className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Reward:</span>
              <span className="font-bold text-primary">{rewards.bonus_points.toLocaleString()} points</span>
            </div>
          )}

          {/* Join / Status */}
          {isJoined ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <div>
                  <span className="font-semibold text-sm text-success">Participating</span>
                  {participation && (
                    <p className="text-[10px] text-muted-foreground">
                      {participation.points_earned || 0} points earned
                    </p>
                  )}
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-success" />
            </div>
          ) : (
            <motion.button
              onClick={onJoin}
              disabled={isJoining}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Zap className="w-4 h-4" />
              Join Event
            </motion.button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
