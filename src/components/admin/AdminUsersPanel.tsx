import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Ban, 
  CheckCircle, 
  Loader2, 
  Coins,
  User,
  Shield,
  Flame
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, username, first_name, raw_points, streak_current, streak_best, total_tasks_completed, total_referrals, is_banned, ban_reason, created_at, wallet_address')
        .order('raw_points', { ascending: false })
        .limit(50);

      if (search.trim()) {
        query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleBan = useMutation({
    mutationFn: async ({ userId, ban, reason }: { userId: string; ban: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: ban, ban_reason: ban ? (reason || 'Banned by admin') : null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
  });

  const adjustPoints = useMutation({
    mutationFn: async ({ userId, amount, currentPoints }: { userId: string; amount: number; currentPoints: number }) => {
      const newBalance = currentPoints + amount;
      const { error } = await supabase
        .from('profiles')
        .update({ raw_points: newBalance })
        .eq('id', userId);
      if (error) throw error;

      await supabase.from('points_ledger').insert({
        user_id: userId,
        amount,
        balance_after: newBalance,
        source: 'admin_adjustment',
        description: `Admin adjustment: ${amount > 0 ? '+' : ''}${amount} points`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
      setPointsToAdd(0);
      toast.success('Points adjusted');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Users Management</h2>
        <p className="text-sm text-muted-foreground">{users.length} users loaded</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        <AnimatePresence>
          {users.map((user: any, index: number) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`bg-card border rounded-xl p-4 ${user.is_banned ? 'border-destructive/30 opacity-70' : 'border-border'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {user.username || user.first_name || 'Anonymous'}
                    </span>
                    {user.is_banned && (
                      <Badge variant="destructive" className="text-[10px]">Banned</Badge>
                    )}
                    {user.wallet_address && (
                      <Badge variant="outline" className="text-[10px]">Wallet</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-yellow-500" />
                      {(user.raw_points || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {user.streak_current || 0}d
                    </span>
                    <span>Tasks: {user.total_tasks_completed || 0}</span>
                    <span>Refs: {user.total_referrals || 0}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedUser(user); setPointsToAdd(0); }}
                  >
                    <Coins className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={user.is_banned ? 'text-green-500' : 'text-destructive'}
                    onClick={() => toggleBan.mutate({ userId: user.id, ban: !user.is_banned })}
                  >
                    {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Adjust Points Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points - {selectedUser?.username || selectedUser?.first_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold">{(selectedUser?.raw_points || 0).toLocaleString()}</p>
            </div>
            <div>
              <Label>Points to Add/Remove</Label>
              <Input
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                placeholder="Enter positive or negative number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use negative number to deduct points
              </p>
            </div>
            {pointsToAdd !== 0 && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm">
                  New balance: <span className="font-bold">{((selectedUser?.raw_points || 0) + pointsToAdd).toLocaleString()}</span>
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button
                disabled={pointsToAdd === 0 || adjustPoints.isPending}
                onClick={() => adjustPoints.mutate({
                  userId: selectedUser.id,
                  amount: pointsToAdd,
                  currentPoints: selectedUser.raw_points || 0,
                })}
              >
                {adjustPoints.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
