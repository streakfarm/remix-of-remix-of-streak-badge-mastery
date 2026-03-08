import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PointsDisplay } from '@/components/dashboard/PointsDisplay';
import { StreakDisplay } from '@/components/dashboard/StreakDisplay';
import { BoxPreview } from '@/components/dashboard/BoxPreview';
import { BadgeShowcase } from '@/components/dashboard/BadgeShowcase';
import { WalletBanner } from '@/components/gamification/WalletBanner';
import { AnnouncementBanner } from '@/components/dashboard/AnnouncementBanner';
import { EventsBanner } from '@/components/events/EventsBanner';
import { useProfile } from '@/hooks/useProfile';
import { motion } from 'framer-motion';

const Index = () => {
  const { profile, isLoading } = useProfile();

  if (isLoading && !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto pb-24">
        {/* Announcement */}
        <AnnouncementBanner />

        {/* Wallet Banner */}
        <WalletBanner />

        {/* Live Events */}
        <EventsBanner />

        {/* Streak display */}
        <StreakDisplay />

        {/* Points display */}
        <PointsDisplay />

        {/* Box preview/CTA */}
        <BoxPreview />

        {/* Badge showcase */}
        <BadgeShowcase />

        {/* Quick stats */}
        <motion.div 
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/boxes" className="bg-card rounded-xl border border-border p-3 text-center hover:border-primary/50 transition-colors">
            <span className="text-2xl font-bold text-foreground">
              {profile?.total_boxes_opened || 0}
            </span>
            <p className="text-[10px] text-muted-foreground uppercase">Boxes Opened</p>
          </Link>
          <Link to="/tasks" className="bg-card rounded-xl border border-border p-3 text-center hover:border-primary/50 transition-colors">
            <span className="text-2xl font-bold text-foreground">
              {profile?.total_tasks_completed || 0}
            </span>
            <p className="text-[10px] text-muted-foreground uppercase">Tasks Done</p>
          </Link>
          <Link to="/leaderboard" className="bg-card rounded-xl border border-border p-3 text-center hover:border-primary/50 transition-colors">
            <span className="text-2xl font-bold text-foreground">
              {profile?.total_referrals || 0}
            </span>
            <p className="text-[10px] text-muted-foreground uppercase">Referrals</p>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Index;
