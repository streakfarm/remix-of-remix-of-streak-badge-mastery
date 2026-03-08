import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, Loader2, Eye, EyeOff, 
  ExternalLink, BarChart3, MousePointerClick
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  redirect_url: string;
  placement: string;
  is_active: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  ad_code: string | null;
}

const PLACEMENTS = [
  { value: 'banner', label: 'Banner', desc: 'Dashboard & page banners' },
  { value: 'native', label: 'Native', desc: 'Compact inline ads in task lists' },
  { value: 'reward', label: 'Reward', desc: 'Shown in Watch Ad modal for points' },
  { value: 'interstitial', label: 'Interstitial', desc: 'Full screen popup ads' },
] as const;

const defaultAd = {
  title: '',
  description: '',
  image_url: '',
  redirect_url: '',
  ad_code: '',
  placement: 'banner',
  is_active: true,
  priority: 0,
};

export function AdminAdsPanel() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adForm, setAdForm] = useState(defaultAd);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
  });

  const createAd = useMutation({
    mutationFn: async (ad: typeof defaultAd) => {
      const { data, error } = await supabase.from('ads').insert({
        title: ad.title,
        description: ad.description || null,
        image_url: ad.image_url || null,
        redirect_url: ad.redirect_url,
        placement: ad.placement,
        is_active: ad.is_active,
        priority: ad.priority,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  });

  const updateAd = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & typeof defaultAd) => {
      const { data, error } = await supabase.from('ads').update({
        title: updates.title,
        description: updates.description || null,
        image_url: updates.image_url || null,
        redirect_url: updates.redirect_url,
        placement: updates.placement,
        is_active: updates.is_active,
        priority: updates.priority,
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  });

  const toggleAd = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('ads').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  });

  const handleOpenDialog = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setAdForm({
        title: ad.title,
        description: ad.description || '',
        image_url: ad.image_url || '',
        redirect_url: ad.redirect_url,
        placement: ad.placement,
        is_active: ad.is_active,
        priority: ad.priority,
      });
    } else {
      setEditingAd(null);
      setAdForm({ ...defaultAd });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!adForm.title || !adForm.redirect_url) {
      toast.error('Title and Redirect URL are required');
      return;
    }
    try {
      if (editingAd) {
        await updateAd.mutateAsync({ id: editingAd.id, ...adForm });
        toast.success('Ad updated');
      } else {
        await createAd.mutateAsync(adForm);
        toast.success('Ad created');
      }
      setIsDialogOpen(false);
    } catch {
      toast.error('Failed to save ad');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAd.mutateAsync(deleteId);
      toast.success('Ad deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete ad');
    }
  };

  const getPlacementColor = (p: string) => {
    switch (p) {
      case 'banner': return 'bg-blue-500/20 text-blue-400';
      case 'interstitial': return 'bg-purple-500/20 text-purple-400';
      case 'native': return 'bg-green-500/20 text-green-400';
      case 'reward': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted';
    }
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
          <h2 className="text-xl font-bold">Ads Management</h2>
          <p className="text-sm text-muted-foreground">{ads.length} total ads</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit Ad' : 'Create Ad'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={adForm.title}
                  onChange={(e) => setAdForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ad title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={adForm.description}
                  onChange={(e) => setAdForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ad description (optional)"
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={adForm.image_url}
                  onChange={(e) => setAdForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label>Redirect URL *</Label>
                <Input
                  value={adForm.redirect_url}
                  onChange={(e) => setAdForm(prev => ({ ...prev, redirect_url: e.target.value }))}
                  placeholder="https://example.com/landing"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Placement</Label>
                  <Select
                    value={adForm.placement}
                    onValueChange={(v) => setAdForm(prev => ({ ...prev, placement: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLACEMENTS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="capitalize">{p.label}</span>
                          <span className="text-xs text-muted-foreground ml-1">— {p.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={adForm.priority}
                    onChange={(e) => setAdForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={adForm.is_active}
                  onCheckedChange={(v) => setAdForm(prev => ({ ...prev, is_active: v }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createAd.isPending || updateAd.isPending}>
                  {(createAd.isPending || updateAd.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAd ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ads List */}
      <div className="space-y-3">
        <AnimatePresence>
          {ads.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                {ad.image_url && (
                  <img src={ad.image_url} alt={ad.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{ad.title}</h3>
                    <Badge className={getPlacementColor(ad.placement)}>{ad.placement}</Badge>
                    {ad.is_active ? (
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">Inactive</Badge>
                    )}
                  </div>
                  {ad.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ad.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> {ad.impressions} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-3 h-3" /> {ad.clicks} clicks
                    </span>
                    <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> Link
                    </a>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAd.mutate({ id: ad.id, is_active: !ad.is_active })}
                  >
                    {ad.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(ad)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(ad.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {ads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No ads yet. Create your first ad!
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
