import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Zap, Clock, ChevronRight, Check, Sparkles } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function EventsBanner() {
  const { events, isParticipating, joinEvent, isLoading } = useEvents();
  const { hapticFeedback } = useTelegram();

  if (isLoading || events.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">Live Events</h3>
      </div>

      {events.slice(0, 2).map((event: any, index: number) => (
        <EventCard
          key={event.id}
          event={event}
          isJoined={isParticipating(event.id)}
          onJoin={() => {
            hapticFeedback('medium');
            joinEvent.mutate(event.id, {
              onSuccess: () => {
                hapticFeedback('success');
                toast.success(`🎉 Joined "${event.name}"!`);
              },
              onError: () => {
                toast.error('Failed to join event');
              },
            });
          }}
          index={index}
          isJoining={joinEvent.isPending}
        />
      ))}
    </div>
  );
}

function EventCard({
  event,
  isJoined,
  onJoin,
  index,
  isJoining,
}: {
  event: any;
  isJoined: boolean;
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

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [event.end_date]);

  const gradients: Record<string, string> = {
    seasonal: 'from-primary/20 via-accent/10 to-secondary/20',
    referral: 'from-secondary/20 via-primary/10 to-accent/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/50',
        `bg-gradient-to-r ${gradients[event.event_type] || gradients.seasonal}`
      )}
    >
      {/* Shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center text-2xl flex-shrink-0">
            {event.icon_emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm truncate">{event.name}</h4>
              {event.bonus_multiplier > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex-shrink-0">
                  {event.bonus_multiplier}× Points
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeLeft}
              </div>
              {event.current_participants > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {event.current_participants}
                </div>
              )}
            </div>
          </div>

          {isJoined ? (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/20 text-success text-xs font-medium flex-shrink-0">
              <Check className="w-3 h-3" />
              Joined
            </div>
          ) : (
            <motion.button
              onClick={onJoin}
              disabled={isJoining}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-3 h-3" />
              Join
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
