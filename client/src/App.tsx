import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import { Switch, Route } from 'wouter';

// Import components
import LoginPage from '@/pages/login';
import HomeStable from '@/pages/home-stable';
import { DocumentsPage } from '@/pages/documents';
import NotFound from '@/pages/not-found';
import { UnifiedAdminPanel } from '@/components/unified-admin-panel';
import { DragDropProvider } from '@/components/drag-drop-provider';
import { GamificationProvider } from '@/components/gamification-provider';
import PWAStatus from '@/components/pwa-status';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GamificationProvider userId="default">
        <DragDropProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <PWAStatus />
            <AppContent />
          </div>
        </DragDropProvider>
      </GamificationProvider>
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
          <Route path="/login" component={LoginPage} />
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/" component={HomeStable} />
          <Route path="/chat/:chatId" component={HomeStable} />
          <Route path="/documents" component={DocumentsPage} />
          {(user?.role === 'admin' || user?.role === 'client-admin' || user?.role === 'dev-admin') && (
            <Route path="/admin" component={UnifiedAdminPanel} />
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;