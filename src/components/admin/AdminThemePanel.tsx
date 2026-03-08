import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Palette } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme, THEMES } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';

export function AdminThemePanel() {
  const { updateConfig } = useAdmin();
  const { activeThemeId } = useTheme();
  const queryClient = useQueryClient();
  const [applying, setApplying] = useState<string | null>(null);

  const handleApplyTheme = async (themeId: string) => {
    if (themeId === activeThemeId) return;
    setApplying(themeId);
    try {
      await updateConfig.mutateAsync({
        id: 'app_theme',
        value: { theme_id: themeId } as unknown as Json,
      });
      queryClient.invalidateQueries({ queryKey: ['app-theme'] });
      toast.success(`Theme "${THEMES.find(t => t.id === themeId)?.name}" applied! 🎨`);
    } catch {
      toast.error('Failed to apply theme');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Theme Manager
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          One-click theme switching — changes apply instantly for all users
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map((theme, index) => {
          const isActive = theme.id === activeThemeId;
          const isApplying = applying === theme.id;

          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleApplyTheme(theme.id)}
              disabled={isApplying}
              className={`relative group text-left rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                isActive
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Color preview bar */}
              <div className="flex h-12">
                <div className="flex-1" style={{ background: theme.preview.bg }} />
                <div className="flex-1" style={{ background: theme.preview.primary }} />
                <div className="flex-1" style={{ background: theme.preview.secondary }} />
                <div className="flex-1" style={{ background: theme.preview.accent }} />
              </div>

              {/* Info */}
              <div className="p-3 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{theme.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{theme.name}</p>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  {isApplying && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                  )}
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  ACTIVE
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
