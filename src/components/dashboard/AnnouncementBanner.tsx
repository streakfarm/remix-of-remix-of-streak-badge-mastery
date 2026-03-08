import { Megaphone, Sparkles, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnnouncementBanner() {

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15"
    >
        {/* Animated glow pulse */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/30 to-primary/20"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ backgroundSize: '200% 200%' }}
          />
        </div>

        <div className="relative z-10 p-4">

          {/* Header with pulsing icon */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 10px 15px -3px hsl(var(--primary) / 0.3)',
                  '0 10px 25px -3px hsl(var(--primary) / 0.5)',
                  '0 10px 15px -3px hsl(var(--primary) / 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Megaphone className="w-5 h-5 text-primary-foreground" />
            </motion.div>

            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-foreground tracking-tight">
                Early Farmer Alert
              </h3>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </motion.div>
            </div>
          </div>

          {/* Body */}
          <p className="text-xs leading-relaxed text-muted-foreground mb-3 pr-4">
            You're an <span className="text-primary font-semibold">early farmer</span>! 
            This is a <span className="text-foreground font-medium">crypto gaming project</span> currently 
            in testing phase. Keep farming daily — complete tasks, build your streak, 
            and stack points. <span className="text-foreground font-medium">Official launch is coming very soon!</span>
          </p>

          {/* Bottom tag */}
          <div className="flex items-center gap-2">
            <motion.div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/25"
              animate={{ borderColor: ['hsl(var(--primary) / 0.25)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.25)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Rocket className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Launching Soon
              </span>
            </motion.div>

            <span className="text-[10px] text-muted-foreground">
              Farm now, earn later 🌾
            </span>
          </div>
        </div>
      </motion.div>
  );
}
