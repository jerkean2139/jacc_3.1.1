import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { Switch, Route } from 'wouter';

// Import components
import LoginPage from '@/pages/login';
import HomeStable from '@/pages/home-stable';
import DocumentsPage from '@/pages/documents-page';
import CalculatorPage from '@/pages/calculator-page';
import IsoAmpCalculator from '@/pages/iso-amp-calculator';
import NotFound from '@/pages/not-found';
// import { UnifiedAdminPanel } from '@/pages/unified-admin-panel'; // Disabled during Phase 2 cleanup
// import { DragDropProvider } from '@/components/drag-drop-provider'; // Removed during Phase 2 cleanup
// import { GamificationProvider } from '@/components/gamification-provider'; // Removed during Phase 2 cleanup
import PWAStatus from '@/components/pwa-status';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Toaster />
        <PWAStatus />
        <AppContent />
      </div>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/login" component={() => <LoginPage />} />
          <Route path="/" component={() => <LoginPage />} />
        </>
      ) : (
        <>
          <Route path="/" component={() => <HomeStable />} />
          <Route path="/chat/:chatId" component={() => <HomeStable />} />
          <Route path="/documents" component={() => <DocumentsPage />} />
          <Route path="/calculator" component={() => <CalculatorPage />} />
          <Route path="/iso-amp-calculator" component={() => <IsoAmpCalculator />} />
          {/* Admin panel temporarily disabled during Phase 2 cleanup */}
          {/* {(user && (user.role === 'admin' || user.role === 'client-admin' || user.role === 'dev-admin')) && (
            <Route path="/admin" component={() => <UnifiedAdminPanel />} />
          )} */}
        </>
      )}
      <Route component={() => <NotFound />} />
    </Switch>
  );
}

export default App;