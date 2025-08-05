import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { Switch, Route } from 'wouter';

// Import components
import LoginPage from '@/pages/login';
import HomeStable from '@/pages/home-stable';
import DocumentsPage from '@/pages/documents-page';
import HelpCenter from '@/pages/help-center';

import NotFound from '@/pages/not-found';
import UnifiedAdminPanel from '@/pages/unified-admin-panel';
import AdminControlCenter from '@/pages/admin-control-center';
// import { DragDropProvider } from '@/components/drag-drop-provider'; // Removed during Phase 2 cleanup
// import { GamificationProvider } from '@/components/gamification-provider'; // Removed during Phase 2 cleanup
import PWAStatus from '@/components/pwa-status';
import { BottomNav } from '@/components/bottom-nav';

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

  // If there's an authentication error but we're on admin routes, show special message
  if (error && window.location.pathname.includes('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in with admin privileges to access this page.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
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
                <Route path="/admin-unified" component={UnifiedAdminPanel} />
              </>
            )}
          </>
        )}
        <Route component={() => <NotFound />} />
      </Switch>
      
      {/* Bottom Navigation for Mobile - Always visible when user is logged in */}
      {user && <BottomNav />}
    </>
  );
}

export default App;