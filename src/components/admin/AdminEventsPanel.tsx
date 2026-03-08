import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const EMOJIS = ['🚀', '🎯', '🎮', '🏆', '💰', '🎁', '🔥', '⭐', '💎', '🎉', '🌟', '👑'];

interface EventForm {
  name: string;
  description: string;
  icon_emoji: string;
  event_type: string;
  start_date: string;
  end_date: string;
  bonus_multiplier: number;
  is_active: boolean;
  rewards: { bonus_points: number; badge?: string };
}

const defaultForm: EventForm = {
  name: '',
  description: '',
  icon_emoji: '🚀',
  event_type: 'seasonal',
  start_date: new Date().toISOString().slice(0, 16),
  end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  bonus_multiplier: 1.5,
  is_active: true,
  rewards: { bonus_points: 1000 },
};

export function AdminEventsPanel() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertEvent = useMutation({
    mutationFn: async (data: EventForm & { id?: string }) => {
      const payload = {
        name: data.name,
        description: data.description,
        icon_emoji: data.icon_emoji,
        event_type: data.event_type,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        bonus_multiplier: data.bonus_multiplier,
        is_active: data.is_active,
        rewards: data.rewards as any,
      };

      if (data.id) {
        const { error } = await supabase.from('seasonal_events').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('seasonal_events').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['seasonal-events'] });
      setIsDialogOpen(false);
      toast.success(editingEvent ? 'Event updated' : 'Event created');
    },
    onError: () => toast.error('Failed to save event'),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seasonal_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setDeleteId(null);
      toast.success('Event deleted');
    },
  });

  const handleOpen = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      setForm({
        name: event.name,
        description: event.description || '',
        icon_emoji: event.icon_emoji || '🚀',
        event_type: event.event_type || 'seasonal',
        start_date: new Date(event.start_date).toISOString().slice(0, 16),
        end_date: new Date(event.end_date).toISOString().slice(0, 16),
        bonus_multiplier: event.bonus_multiplier || 1,
        is_active: event.is_active ?? true,
        rewards: event.rewards || { bonus_points: 0 },
      });
    } else {
      setEditingEvent(null);
      setForm(defaultForm);
    }
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Events Management</h2>
          <p className="text-sm text-muted-foreground">{events.length} total events</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <AnimatePresence>
          {events.map((event: any, index: number) => {
            const isLive = event.is_active && new Date(event.end_date) > new Date();
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card border rounded-xl p-4 ${isLive ? 'border-primary/30' : 'border-border opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{event.icon_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{event.name}</h3>
                      {isLive && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Live</Badge>}
                      {event.bonus_multiplier > 1 && (
                        <Badge className="bg-primary/20 text-primary text-[10px]">
                          <Zap className="w-3 h-3 mr-0.5" />{event.bonus_multiplier}×
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.current_participants || 0} joined
                      </span>
                      {event.rewards?.bonus_points > 0 && (
                        <span className="text-primary font-medium">+{event.rewards.bonus_points} pts</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(event)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No events yet. Create one!</div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <Label>Icon</Label>
                <select
                  value={form.icon_emoji}
                  onChange={(e) => setForm(p => ({ ...p, icon_emoji: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-2 text-xl"
                >
                  {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <Label>Event Name</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Event name" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Event description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points Multiplier</Label>
                <Input type="number" step="0.1" value={form.bonus_multiplier} onChange={(e) => setForm(p => ({ ...p, bonus_multiplier: parseFloat(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label>Join Bonus Points</Label>
                <Input type="number" value={form.rewards.bonus_points} onChange={(e) => setForm(p => ({ ...p, rewards: { ...p.rewards, bonus_points: parseInt(e.target.value) || 0 } }))} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => upsertEvent.mutate({ ...form, id: editingEvent?.id })}
                disabled={upsertEvent.isPending || !form.name}
              >
                {upsertEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the event and all participation records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteEvent.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
