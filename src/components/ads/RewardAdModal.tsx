import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAds, Ad } from '@/hooks/useAds';
import { AdUnitRenderer } from './AdUnitRenderer';
import { X, ExternalLink, Play, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RewardAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  pointsReward: number;
  watchDuration?: number;
}

export function RewardAdModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  pointsReward, 
  watchDuration = 5 
}: RewardAdModalProps) {
  const { ads, getRandomAd, trackImpression, trackClick } = useAds('reward');
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [progress, setProgress] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && ads.length > 0) {
      const ad = getRandomAd();
      setCurrentAd(ad);
      if (ad) trackImpression.mutate(ad.id);
      setProgress(0);
      setIsWatching(false);
      setCompleted(false);
      setCompleted(false);
    }
  }, [isOpen, ads]);

  useEffect(() => {
    if (!isWatching || completed) return;

    const duration = watchDuration * 1000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timer);
        setCompleted(true);
        setCompleted(true);
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [isWatching, completed, watchDuration]);

  const handleStart = () => setIsWatching(true);

  const handleAdClick = () => {
    if (currentAd) {
      trackClick.mutate(currentAd.id);
      if (currentAd.redirect_url) {
        window.open(currentAd.redirect_url, '_blank');
      }
    }
  };

  const handleClaim = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-card rounded-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Watch Ad</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <Coins className="w-3 h-3 text-yellow-500" />
                <span className="font-bold text-yellow-500">+{pointsReward}</span>
              </div>
              {completed && (
                <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isWatching && (
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {!isWatching ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Watch an ad to earn points!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Watch for {watchDuration} seconds to earn +{pointsReward} points
                  </p>
                </div>
                <Button onClick={handleStart} className="w-full bg-gradient-to-r from-primary to-accent">
                  <Play className="w-4 h-4 mr-2" />
                  Start Watching
                </Button>
              </div>
            ) : completed ? (
              <div className="text-center py-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
                >
                  <Coins className="w-8 h-8 text-yellow-500" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-lg">Ad Watched! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    You earned <strong className="text-yellow-500">+{pointsReward} points</strong>
                  </p>
                </div>
                <Button onClick={handleClaim} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                  Claim Points
                </Button>
              </div>
            ) : (
              /* Watching state — show actual ad content */
              <div className="space-y-3">
                {currentAd?.ad_code ? (
                  /* Render actual ad unit code */
                  <div className="rounded-xl overflow-hidden bg-muted/30 min-h-[200px]">
                    <AdUnitRenderer adCode={currentAd.ad_code} className="min-h-[200px]" />
                  </div>
                ) : currentAd ? (
                  /* Fallback: image/link based ad */
                  <div className="cursor-pointer group" onClick={handleAdClick}>
                    {currentAd.image_url && (
                      <div className="w-full aspect-video rounded-xl overflow-hidden mb-3">
                        <img 
                          src={currentAd.image_url} 
                          alt={currentAd.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{currentAd.title}</p>
                        {currentAd.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{currentAd.description}</p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading ad...</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {Math.ceil((100 - progress) / 100 * watchDuration)}s remaining...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
