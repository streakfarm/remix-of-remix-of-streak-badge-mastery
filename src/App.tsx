import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { TonWalletProvider } from "@/hooks/useTonWallet";
import { MultiWalletProvider } from "@/hooks/useMultiWallet";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { useTheme } from "@/hooks/useTheme";

const queryClient = new QueryClient();

function AppContent() {
  const { isLoading, isAuthenticated, authError, retryAuth } = useAuth();

  console.log("AppContent state:", { isLoading, isAuthenticated, authError });

  if (authError) {
    return <SplashScreen error={authError} onRetry={retryAuth} />;
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TonWalletProvider>
        <MultiWalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </MultiWalletProvider>
      </TonWalletProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
