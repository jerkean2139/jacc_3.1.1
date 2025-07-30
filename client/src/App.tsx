import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { Switch, Route } from 'wouter';

// Import components
import LoginPage from '@/pages/login';
import HomeStable from '@/pages/home-stable';
import DocumentsPage from '@/pages/documents-page';
import HelpCenter from '@/pages/help-center';

import NotFound from '@/pages/not-found';
import AdminControlCenter from '@/pages/admin-control-center';
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
  const { user, isLoading, error } = useAuth();
  
  // Debug logging for white screen issues
  console.log('App render debug:', { user: !!user, isLoading, error, location: window.location.pathname });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading JACC...</p>
        </div>
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
          <Route path="/help" component={() => <HelpCenter />} />

          {/* Admin Control Center Routes */}
          {user && (user.role === 'admin' || user.role === 'client-admin' || user.role === 'dev-admin') && (
            <>
              <Route path="/admin" component={AdminControlCenter} />
              <Route path="/admin-control-center" component={AdminControlCenter} />
            </>
          )}
        </>
      )}
      <Route component={() => <NotFound />} />
    </Switch>
  );
}

export default App;