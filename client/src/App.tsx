import { Switch, Route } from "wouter";
import { lazy } from "react";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { GamificationProvider } from "@/hooks/useGamification";
import { DragDropProvider } from "@/components/drag-drop-provider";
import PWAStatus from "@/components/pwa-status";
// import OfflineIndicator from "@/components/offline-indicator"; // REMOVED
// Removed unused tutorial components
import OfflineIndicator from "@/components/offline-indicator";
import ContextualHelp from "@/components/contextual-help";
import InteractiveTutorial from "@/components/interactive-tutorial";
// import OnboardingWalkthrough from "@/components/onboarding-walkthrough"; // DISABLED - No automatic popups
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import BottomNav from "@/components/bottom-nav";
import "@/utils/clear-popup-flags"; // Auto-clear popup flags on app load
import { suppressDevelopmentWarnings, handlePWAInstallPrompt } from "@/lib/deployment-utils";

import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import HomeStable from "@/pages/home-stable";
import NotFound from "@/pages/not-found";
import AdminSettings from "@/pages/admin-settings";
// import AdminDashboard from "@/pages/admin-dashboard"; // REMOVED
import AdminTraining from "@/pages/admin-training";
import AIConfigurationPage from "@/pages/ai-configuration";

import DevAdminPanel from "@/pages/dev-admin-panel";
import ISOAmpCalculator from "@/pages/iso-amp-calculator";
import PricingComparison from "@/pages/pricing-comparison";


import PromptCustomization from "@/pages/prompt-customization";
import UserGuide from "@/pages/user-guide";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPanel from "@/pages/admin-panel";
import AdminTraining from "@/pages/admin-training";
import AIConfigurationPage from "@/pages/ai-configuration";
import SimpleAdminLogin from "@/pages/simple-admin-login";
import DevAdminPanel from "@/pages/dev-admin-panel";
import ISOAmpCalculator from "@/pages/iso-amp-calculator";
import PricingComparison from "@/pages/pricing-comparison";
import PricingManagement from "@/pages/pricing-management";
import PricingDemo from "@/pages/pricing-demo";
import PromptCustomization from "@/pages/prompt-customization";
import UserGuide from "@/pages/user-guide";
import AgentLeaderboard from "@/pages/agent-leaderboard";
import DocumentsPage from "@/pages/documents-page";
import DocumentViewer from "@/pages/document-viewer";
import MerchantInsights from "@/pages/merchant-insights";
import GamificationPage from "@/pages/gamification-page";
import HelpPage from "@/pages/help";
// import VendorIntelligenceDashboard from "@/pages/vendor-intelligence-dashboard"; // REMOVED
import VendorIntelligenceDashboard from "@/pages/vendor-intelligence-dashboard";
import ISOHubIntegration from "@/pages/iso-hub-integration";
import ISOHub from "@/pages/iso-hub";
import AdminChatMonitoring from "@/pages/admin-chat-monitoring";
import LearningPathPage from "@/pages/learning-path";
import ChatTesting from "@/pages/chat-testing";

import UnifiedAdminPanel from "@/pages/unified-admin-panel";

import FAQManager from "@/pages/faq-manager";
// import ConsolidatedAdmin from "@/pages/consolidated-admin"; // REMOVED
import DragDropDocsPage from "@/pages/drag-drop-docs";
// import AdminControlCenter from "@/pages/admin-control-center"; // REMOVED
import DemoAdmin from "@/pages/demo-admin";
import UnifiedAdminPanel from "@/pages/unified-admin-panel";
import TestMessages from "@/pages/test-messages";
import FAQManager from "@/pages/faq-manager";
import ConsolidatedAdmin from "@/pages/consolidated-admin";
import DragDropDocsPage from "@/pages/drag-drop-docs";
import AdminControlCenter from "@/pages/admin-control-center";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public test route - bypasses authentication */}

      
      {!user ? (
        <>


          <Route path="/login" component={LoginPage} />
          <Route path="/admin-control-center" component={UnifiedAdminPanel} />
          <Route path="/admin" component={UnifiedAdminPanel} />
      <Route path="/test-messages/:id" component={TestMessages} />
      
      {!user ? (
        <>
          <Route path="/demo-admin" component={DemoAdmin} />
          <Route path="/admin-login" component={SimpleAdminLogin} />
          <Route path="/login" component={LoginPage} />
          <Route path="/admin-control-center" component={AdminControlCenter} />
          <Route path="/admin" component={AdminControlCenter} />
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/login">
            {() => {
              window.location.href = '/';
              return null;
            }}
          </Route>
          <Route path="/" component={HomeStable} />
          <Route path="/chat/:chatId" component={HomeStable} />
          {/* ISO AMP Calculator routes disabled - coming soon */}
          <Route path="/calculator" component={ISOAmpCalculator} />
          <Route path="/iso-amp-calculator" component={ISOAmpCalculator} />
          {/* <Route path="/calculator" component={ISOAmpCalculator} /> */}
          {/* <Route path="/iso-amp-calculator" component={ISOAmpCalculator} /> */}
          <Route path="/pricing-comparison" component={PricingComparison} />

          <Route path="/guide" component={UserGuide} />
          <Route path="/documents" component={DocumentsPage} />
          <Route path="/documents/:documentId" component={DocumentViewer} />
          <Route path="/documents/view/:documentId" component={DocumentViewer} />
          {/* Admin only routes */}
          {(user?.role === 'admin' || user?.role === 'client-admin' || user?.role === 'dev-admin') && (
            <>
              <Route path="/admin-control-center" component={UnifiedAdminPanel} />
          <Route path="/agent-leaderboard" component={AgentLeaderboard} />
          {/* Admin only routes */}
          {user?.role === 'admin' && (
            <>
              <Route path="/admin-control-center" component={AdminControlCenter} />
            </>
          )}
          <Route path="/prompts" component={PromptCustomization} />
          <Route path="/prompt-customization" component={PromptCustomization} />
          <Route path="/merchant-insights" component={MerchantInsights} />
          <Route path="/leaderboard" component={GamificationPage} />
          <Route path="/help" component={HelpPage} />
          <Route path="/learning" component={LearningPathPage} />
          {/* <Route path="/vendor-intelligence" component={VendorIntelligenceDashboard} /> REMOVED */}
          <Route path="/vendor-intelligence" component={VendorIntelligenceDashboard} />
          <Route path="/competitive-intelligence" component={lazy(() => import("@/pages/competitive-intelligence-dashboard"))} />
          {/* ISO Hub - Hidden from regular users, accessible only to dev admin */}
          {user?.role === 'dev' && (
            <>
              <Route path="/iso-hub-integration" component={ISOHubIntegration} />
              <Route path="/iso-hub" component={ISOHub} />
            </>
          )}
          <Route path="/dev-admin" component={DevAdminPanel} />
          <Route path="/admin" component={UnifiedAdminPanel} />
          <Route path="/admin-panel" component={UnifiedAdminPanel} />
          <Route path="/admin/unified" component={UnifiedAdminPanel} />
          <Route path="/admin-new" component={UnifiedAdminPanel} />
          {/* <Route path="/admin/dashboard" component={AdminDashboard} /> REMOVED */}
          <Route path="/faq-manager" component={FAQManager} />
          {/* <Route path="/consolidated-admin" component={ConsolidatedAdmin} /> REMOVED */}
          <Route path="/drag-drop-docs" component={DragDropDocsPage} />
          <Route path="/admin/chat-monitoring" component={AdminChatMonitoring} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/training" component={UnifiedAdminPanel} />
          <Route path="/admin-training" component={UnifiedAdminPanel} />
          <Route path="/admin/ai-config" component={AIConfigurationPage} />
          {/* PWA Settings route for mobile admin view */}
          <Route path="/settings" component={UnifiedAdminPanel} />
          <Route path="/admin" component={AdminControlCenter} />
          <Route path="/admin-panel" component={AdminControlCenter} />
          <Route path="/admin/unified" component={UnifiedAdminPanel} />
          <Route path="/admin-new" component={AdminControlCenter} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/faq-manager" component={FAQManager} />
          <Route path="/consolidated-admin" component={ConsolidatedAdmin} />
          <Route path="/drag-drop-docs" component={DragDropDocsPage} />
          <Route path="/admin/chat-monitoring" component={AdminChatMonitoring} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/training" component={AdminControlCenter} />
          <Route path="/admin-training" component={AdminControlCenter} />
          <Route path="/admin/ai-config" component={AIConfigurationPage} />
          {/* PWA Settings route for mobile admin view */}
          <Route path="/settings" component={AdminControlCenter} />
          <Route path="/admin/chat-testing" component={ChatTesting} />
          <Route path="/login" component={Landing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <GamificationProvider userId={user?.id}>
      <DragDropProvider>
        <div className="min-h-screen bg-background safe-top safe-bottom w-full max-w-full overflow-x-hidden">
          <Toaster />
          <PWAStatus />
          {/* <OfflineIndicator /> REMOVED */}
          {/* <div className="hidden md:block">
            <ContextualHelp />
          </div> REMOVED */}
        <div className="min-h-screen bg-background safe-top safe-bottom">
          <Toaster />
          <PWAStatus />
          <OfflineIndicator />
          <div className="hidden md:block">
            <ContextualHelp />
          </div>
          {/* <InteractiveTutorial /> DISABLED - No automatic popups */}
          {/* <OnboardingWalkthrough /> DISABLED - No automatic popups */}
          <PWAInstallPrompt />
          <Router />
          {/* Only show bottom navigation when user is authenticated */}
          {user && <BottomNav />}
        </div>
      </DragDropProvider>
    </GamificationProvider>
  );
}

function App() {
  // Initialize deployment utilities on app start
  React.useEffect(() => {
    suppressDevelopmentWarnings();
    handlePWAInstallPrompt();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
