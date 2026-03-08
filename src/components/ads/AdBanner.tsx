import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAds, Ad } from '@/hooks/useAds';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  placement: string;
  className?: string;
  dismissible?: boolean;
  compact?: boolean;
}

export function AdBanner({ placement, className, dismissible = false, compact = false }: AdBannerProps) {
  const { ads, getRandomAd, trackImpression, trackClick } = useAds(placement);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (ads.length > 0 && !currentAd) {
      const ad = getRandomAd();
      setCurrentAd(ad);
      if (ad) trackImpression.mutate(ad.id);
    }
  }, [ads]);

  if (!currentAd || dismissed) return null;

  const handleClick = () => {
    trackClick.mutate(currentAd.id);
    window.open(currentAd.redirect_url, '_blank');
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer group",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 p-3">
          {currentAd.image_url && (
            <img src={currentAd.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentAd.title}</p>
            {currentAd.description && (
              <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </div>
        <div className="absolute top-1 right-1">
          <span className="text-[8px] text-muted-foreground/50 px-1">Ad</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer group",
        className
      )}
      onClick={handleClick}
    >
      {currentAd.image_url && (
        <div className="w-full aspect-[3/1] overflow-hidden">
          <img 
            src={currentAd.image_url} 
            alt={currentAd.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{currentAd.title}</p>
            {currentAd.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{currentAd.description}</p>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
        </div>
      </div>

      {/* Ad label + dismiss */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="text-[10px] bg-background/80 text-muted-foreground px-1.5 py-0.5 rounded">Ad</span>
        {dismissible && (
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="w-5 h-5 bg-background/80 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
