import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, ChevronRight, Loader2, Sparkles, Star, ExternalLink, X } from 'lucide-react';
import { useTonWalletContext } from '@/hooks/useTonWallet';
import { useMultiWallet, WalletType } from '@/hooks/useMultiWallet';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MultiWalletCardProps {
  className?: string;
}

const WALLET_OPTIONS: {
  type: WalletType;
  name: string;
  icon: string;
  chain: string;
  color: string;
  gradient: string;
  description: string;
}[] = [
  {
    type: 'ton',
    name: 'TON Wallet',
    icon: '💎',
    chain: 'TON',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    description: 'Telegram native wallet',
  },
  {
    type: 'evm',
    name: 'MetaMask',
    icon: '🦊',
    chain: 'Ethereum',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-500/20',
    description: 'Ethereum & EVM chains',
  },
  {
    type: 'solana',
    name: 'Phantom',
    icon: '👻',
    chain: 'Solana',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-violet-500/20',
    description: 'Solana ecosystem',
  },
];

export function MultiWalletCard({ className }: MultiWalletCardProps) {
  const { isConnected: tonConnected, walletAddress: tonAddress, connect: connectTon, disconnect: disconnectTon } = useTonWalletContext();
  const { connectedWallets, primaryWallet, isConnecting, connectingType, connectEVM, connectSolana, disconnectWallet, setPrimaryWallet } = useMultiWallet();
  const { hapticFeedback } = useTelegram();
  const [expandedWallet, setExpandedWallet] = useState<WalletType | null>(null);

  const isWalletConnected = (type: WalletType) => {
    if (type === 'ton') return tonConnected;
    return connectedWallets.some(w => w.type === type);
  };

  const getWalletAddress = (type: WalletType) => {
    if (type === 'ton') return tonAddress;
    return connectedWallets.find(w => w.type === type)?.address || null;
  };

  const handleConnect = async (type: WalletType) => {
    hapticFeedback('medium');
    switch (type) {
      case 'ton': await connectTon(); break;
      case 'evm': await connectEVM(); break;
      case 'solana': await connectSolana(); break;
    }
  };

  const handleDisconnect = async (type: WalletType) => {
    hapticFeedback('light');
    if (type === 'ton') {
      await disconnectTon();
    } else {
      await disconnectWallet(type);
    }
  };

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const totalConnected = WALLET_OPTIONS.filter(w => isWalletConnected(w.type)).length;

  return (
    <motion.div
      className={cn('space-y-4', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Multi-Chain Wallets
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect wallets to unlock badges & rewards
          </p>
        </div>
        {totalConnected > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
            <Check className="w-3 h-3" />
            {totalConnected}/{WALLET_OPTIONS.length}
          </div>
        )}
      </div>

      {/* Wallet Cards */}
      <div className="space-y-3">
        {WALLET_OPTIONS.map((wallet, index) => {
          const connected = isWalletConnected(wallet.type);
          const address = getWalletAddress(wallet.type);
          const isPrimary = primaryWallet?.type === wallet.type || (wallet.type === 'ton' && tonConnected && !primaryWallet);
          const isExpanded = expandedWallet === wallet.type;
          const isCurrentlyConnecting = isConnecting && connectingType === wallet.type;

          return (
            <motion.div
              key={wallet.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative overflow-hidden rounded-xl border transition-all',
                connected
                  ? `bg-gradient-to-r ${wallet.gradient} border-border/50`
                  : 'bg-card border-border hover:border-muted-foreground/30'
              )}
            >
              {/* Primary badge */}
              {connected && isPrimary && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold"
                >
                  <Star className="w-3 h-3" fill="currentColor" />
                  Primary
                </motion.div>
              )}

              {/* Main row */}
              <button
                onClick={() => {
                  if (connected) {
                    setExpandedWallet(isExpanded ? null : wallet.type);
                  } else {
                    handleConnect(wallet.type);
                  }
                }}
                disabled={isCurrentlyConnecting}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <motion.div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                    connected ? 'bg-background/50' : 'bg-muted/50'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {wallet.icon}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{wallet.name}</span>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium',
                      connected ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    )}>
                      {wallet.chain}
                    </span>
                  </div>

                  {connected && address ? (
                    <p className={cn('text-xs font-mono mt-0.5', wallet.color)}>
                      {shortenAddress(address)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {wallet.description}
                    </p>
                  )}
                </div>

                {isCurrentlyConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : connected ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Expanded actions */}
              <AnimatePresence>
                {isExpanded && connected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 flex gap-2">
                      {!isPrimary && (
                        <button
                          onClick={() => setPrimaryWallet(wallet.type)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Star className="w-3 h-3" />
                          Set Primary
                        </button>
                      )}
                      {address && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(address);
                            hapticFeedback('selection');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Copy Address
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDisconnect(wallet.type);
                          setExpandedWallet(null);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bonus info */}
      {totalConnected === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/30 border border-border"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            Connect any wallet for <strong className="text-primary">+2,000 bonus points</strong>
          </span>
        </motion.div>
      )}

      {totalConnected === WALLET_OPTIONS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border border-primary/30"
        >
          <span className="text-lg">🏆</span>
          <span className="text-xs font-semibold text-primary">
            All wallets connected! Maximum rewards unlocked!
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
