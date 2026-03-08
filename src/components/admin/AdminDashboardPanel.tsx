import { motion } from 'framer-motion';
import { 
  Users, 
  Coins, 
  Flame, 
  Award,
  Package,
  ListTodo,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AdminDashboardPanel() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalTasks },
        { count: totalBadges },
        { count: totalEvents },
        { count: totalBoxes },
        { data: topUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('badges').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('seasonal_events').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('boxes').select('*', { count: 'exact', head: true }).is('opened_at', null).eq('is_expired', false),
        supabase.from('profiles').select('username, first_name, raw_points').order('raw_points', { ascending: false }).limit(5),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalTasks: totalTasks || 0,
        totalBadges: totalBadges || 0,
        totalEvents: totalEvents || 0,
        totalBoxes: totalBoxes || 0,
        topUsers: topUsers || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Tasks', value: stats?.totalTasks || 0, icon: ListTodo, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Active Badges', value: stats?.totalBadges || 0, icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Live Events', value: stats?.totalEvents || 0, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Pending Boxes', value: stats?.totalBoxes || 0, icon: Package, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">Quick stats for StreakFarm</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topUsers?.map((user: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm">
                      {user.username || user.first_name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-sm font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    {(user.raw_points || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!stats?.topUsers || stats.topUsers.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
