import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type WalletType = 'ton' | 'evm' | 'solana';

export interface WalletInfo {
  type: WalletType;
  address: string;
  name: string;
  icon: string;
  chainName: string;
}

interface MultiWalletContextType {
  connectedWallets: WalletInfo[];
  primaryWallet: WalletInfo | null;
  isConnecting: boolean;
  connectingType: WalletType | null;
  connectEVM: () => Promise<void>;
  connectSolana: () => Promise<void>;
  disconnectWallet: (type: WalletType) => Promise<void>;
  setPrimaryWallet: (type: WalletType) => void;
}

const MultiWalletContext = createContext<MultiWalletContextType | null>(null);

export function MultiWalletProvider({ children }: { children: ReactNode }) {
  const [connectedWallets, setConnectedWallets] = useState<WalletInfo[]>([]);
  const [primaryWallet, setPrimaryWalletState] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState<WalletType | null>(null);
  const { updateProfile, profile } = useProfile();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  // Restore from profile on load
  useEffect(() => {
    if (profile?.wallet_address && profile?.wallet_type) {
      const existing: WalletInfo = {
        type: profile.wallet_type as WalletType,
        address: profile.wallet_address,
        name: getWalletName(profile.wallet_type as WalletType),
        icon: getWalletIcon(profile.wallet_type as WalletType),
        chainName: getChainName(profile.wallet_type as WalletType),
      };
      setConnectedWallets(prev => {
        if (prev.some(w => w.type === existing.type)) return prev;
        return [...prev, existing];
      });
      if (!primaryWallet) setPrimaryWalletState(existing);
    }
  }, [profile?.wallet_address, profile?.wallet_type]);

  const connectEVM = useCallback(async () => {
    if (!(window as any).ethereum) {
      toast.error('MetaMask not found! Please install MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    setConnectingType('evm');
    hapticFeedback('medium');

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const walletInfo: WalletInfo = {
          type: 'evm',
          address,
          name: 'MetaMask',
          icon: '🦊',
          chainName: 'Ethereum',
        };

        setConnectedWallets(prev => {
          const filtered = prev.filter(w => w.type !== 'evm');
          return [...filtered, walletInfo];
        });

        if (!primaryWallet) {
          setPrimaryWalletState(walletInfo);
          await syncWalletToProfile(walletInfo);
        }

        hapticFeedback('success');
        toast.success('🦊 MetaMask connected!', {
          description: `${address.slice(0, 6)}...${address.slice(-4)}`,
        });

        await awardWalletBadge(address);
      }
    } catch (error: any) {
      console.error('EVM connect error:', error);
      hapticFeedback('error');
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect MetaMask');
      }
    } finally {
      setIsConnecting(false);
      setConnectingType(null);
    }
  }, [hapticFeedback, primaryWallet]);

  const connectSolana = useCallback(async () => {
    const solana = (window as any).solana || (window as any).phantom?.solana;
    
    if (!solana?.isPhantom) {
      toast.error('Phantom wallet not found! Please install Phantom.');
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);
    setConnectingType('solana');
    hapticFeedback('medium');

    try {
      const response = await solana.connect();
      const address = response.publicKey.toString();

      const walletInfo: WalletInfo = {
        type: 'solana',
        address,
        name: 'Phantom',
        icon: '👻',
        chainName: 'Solana',
      };

      setConnectedWallets(prev => {
        const filtered = prev.filter(w => w.type !== 'solana');
        return [...filtered, walletInfo];
      });

      if (!primaryWallet) {
        setPrimaryWalletState(walletInfo);
        await syncWalletToProfile(walletInfo);
      }

      hapticFeedback('success');
      toast.success('👻 Phantom connected!', {
        description: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      await awardWalletBadge(address);
    } catch (error: any) {
      console.error('Solana connect error:', error);
      hapticFeedback('error');
      toast.error('Failed to connect Phantom');
    } finally {
      setIsConnecting(false);
      setConnectingType(null);
    }
  }, [hapticFeedback, primaryWallet]);

  const disconnectWallet = useCallback(async (type: WalletType) => {
    hapticFeedback('light');

    if (type === 'solana') {
      const solana = (window as any).solana || (window as any).phantom?.solana;
      if (solana) await solana.disconnect();
    }

    setConnectedWallets(prev => prev.filter(w => w.type !== type));

    if (primaryWallet?.type === type) {
      const remaining = connectedWallets.filter(w => w.type !== type);
      if (remaining.length > 0) {
        setPrimaryWalletState(remaining[0]);
        await syncWalletToProfile(remaining[0]);
      } else {
        setPrimaryWalletState(null);
        await updateProfile.mutateAsync({ wallet_address: null, wallet_type: null });
      }
    }

    toast.success(`${getWalletName(type)} disconnected`);
  }, [hapticFeedback, primaryWallet, connectedWallets]);

  const setPrimaryWallet = useCallback((type: WalletType) => {
    const wallet = connectedWallets.find(w => w.type === type);
    if (wallet) {
      setPrimaryWalletState(wallet);
      syncWalletToProfile(wallet);
      hapticFeedback('selection');
      toast.success(`${wallet.name} set as primary wallet`);
    }
  }, [connectedWallets, hapticFeedback]);

  const syncWalletToProfile = async (wallet: WalletInfo) => {
    try {
      await updateProfile.mutateAsync({
        wallet_address: wallet.address,
        wallet_type: wallet.type,
      });
    } catch (error) {
      console.error('Error syncing wallet:', error);
    }
  };

  const awardWalletBadge = async (walletAddress: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-wallet-badge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ walletAddress }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        hapticFeedback('success');
        toast.success(`🎉 Wallet Badge Earned! +${result.points_awarded} points`, {
          description: result.badge_name || 'Wallet badge unlocked!',
        });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      }
    } catch (error) {
      console.error('Error awarding wallet badge:', error);
    }
  };

  return (
    <MultiWalletContext.Provider
      value={{
        connectedWallets,
        primaryWallet,
        isConnecting,
        connectingType,
        connectEVM,
        connectSolana,
        disconnectWallet,
        setPrimaryWallet,
      }}
    >
      {children}
    </MultiWalletContext.Provider>
  );
}

export function useMultiWallet() {
  const context = useContext(MultiWalletContext);
  if (!context) {
    return {
      connectedWallets: [],
      primaryWallet: null,
      isConnecting: false,
      connectingType: null,
      connectEVM: async () => {},
      connectSolana: async () => {},
      disconnectWallet: async () => {},
      setPrimaryWallet: () => {},
    };
  }
  return context;
}

function getWalletName(type: WalletType): string {
  switch (type) {
    case 'ton': return 'TON Wallet';
    case 'evm': return 'MetaMask';
    case 'solana': return 'Phantom';
    default: return 'Wallet';
  }
}

function getWalletIcon(type: WalletType): string {
  switch (type) {
    case 'ton': return '💎';
    case 'evm': return '🦊';
    case 'solana': return '👻';
    default: return '👛';
  }
}

function getChainName(type: WalletType): string {
  switch (type) {
    case 'ton': return 'TON';
    case 'evm': return 'Ethereum';
    case 'solana': return 'Solana';
    default: return 'Unknown';
  }
}
