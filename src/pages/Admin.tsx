import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ListTodo, 
  Award, 
  Settings, 
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Bell,
  Package,
  LayoutDashboard,
  Users,
  Calendar,
  Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDashboardPanel } from '@/components/admin/AdminDashboardPanel';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';
import { AdminTasksPanel } from '@/components/admin/AdminTasksPanel';
import { AdminBadgesPanel } from '@/components/admin/AdminBadgesPanel';
import { AdminEventsPanel } from '@/components/admin/AdminEventsPanel';
import { AdminConfigPanel } from '@/components/admin/AdminConfigPanel';
import { AdminNotificationsPanel } from '@/components/admin/AdminNotificationsPanel';
import { AdminBoxPanel } from '@/components/admin/AdminBoxPanel';
import { AdminAdsPanel } from '@/components/admin/AdminAdsPanel';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isCheckingAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-destructive/50 rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin panel.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'boxes', label: 'Boxes', icon: Package },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'notifications', label: 'Notify', icon: Bell },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Manage StreakFarm</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full mb-6">
            <TabsList className="inline-flex w-max bg-muted/50 p-1">
              {tabs.map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="gap-1.5 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <AnimatePresence mode="popLayout">
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {tab.id === 'dashboard' && <AdminDashboardPanel />}
                  {tab.id === 'users' && <AdminUsersPanel />}
                  {tab.id === 'tasks' && <AdminTasksPanel />}
                  {tab.id === 'badges' && <AdminBadgesPanel />}
                  {tab.id === 'events' && <AdminEventsPanel />}
                  {tab.id === 'boxes' && <AdminBoxPanel />}
                  {tab.id === 'ads' && <AdminAdsPanel />}
                  {tab.id === 'notifications' && <AdminNotificationsPanel />}
                  {tab.id === 'config' && <AdminConfigPanel />}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
}
