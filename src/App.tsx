import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { GlobalErrorFallback } from "@/components/GlobalErrorFallback";
// Auth and Context
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import { lazy, Suspense } from "react";
import { SessionTimeoutModal } from "@/components/auth/SessionTimeoutModal";
import { NetworkStatusIndicator } from "@/components/ui/NetworkStatusIndicator";
import { trackPageLoad } from "@/lib/performance";
import { logger } from "@/lib/logger";

const LoadingScreen = () => <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

const PerformanceRouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageLoad(location.pathname);
  }, [location.pathname]);

  return null;
};

// Create IndexedDB persister for offline queueing
const createIDBPersister = (idbValidKey: string = "reactQuery") => ({
  persistClient: async (client: any) => {
    await set(idbValidKey, client);
  },
  restoreClient: async () => {
    return await get(idbValidKey);
  },
  removeClient: async () => {
    await del(idbValidKey);
  },
});
const persister = createIDBPersister();

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BrowseNeeds = lazy(() => import("./pages/need-posts/BrowseNeeds"));
const MyNeedPosts = lazy(() => import("./pages/need-posts/MyNeedPosts"));
const ViewApplications = lazy(() => import("./pages/need-posts/ViewApplications"));
const MyBookings = lazy(() => import("./pages/bookings/MyBookings"));
const CalendarPage = lazy(() => import("./pages/bookings/CalendarPage"));
const ActiveSession = lazy(() => import("./pages/session/ActiveSession"));
const SafetyCenter = lazy(() => import("./pages/safety/SafetyCenter"));
const MessagesPage = lazy(() => import("./pages/chat/MessagesPage"));
const ReviewPage = lazy(() => import("./pages/reviews/ReviewPage"));
const SitterReviewsPage = lazy(() => import("./pages/reviews/SitterReviewsPage"));
const ChildrenPage = lazy(() => import("./pages/children/ChildrenPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const KVKKPage = lazy(() => import("./pages/legal/KVKKPage"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const SubscriptionPage = lazy(() => import("./pages/subscription/SubscriptionPage"));
const HelpPage = lazy(() => import("./pages/help/HelpPage"));
const AboutPage = lazy(() => import("./pages/about/AboutPage"));
const HowItWorksPage = lazy(() => import("./pages/about/HowItWorksPage"));
const DisputesPage = lazy(() => import("./pages/disputes/DisputesPage"));
const DisputeIntakePage = lazy(() => import("./pages/disputes/DisputeIntakePage"));
const DisputeHistoryPage = lazy(() => import("./pages/disputes/DisputeHistoryPage"));

import { z } from "zod";
import { customErrorMap } from "@/lib/zod-error-map";
z.setErrorMap(customErrorMap);

const SitterProfilePage = lazy(() => import("./pages/sitter/SitterProfilePage"));
const FavoritesPage = lazy(() => import("./pages/sitter/FavoritesPage"));
const EarningsPage = lazy(() => import("./pages/earnings/EarningsPage"));
const PayoutHistoryPage = lazy(() => import("./pages/earnings/PayoutHistoryPage"));
const PaymentConfirmationPage = lazy(() => import("./pages/payments/PaymentConfirmationPage"));
const PaymentReceiptPage = lazy(() => import("./pages/payments/PaymentReceiptPage"));
const PaymentCheckoutPage = lazy(() => import("./pages/payments/PaymentCheckoutPage"));
const FindSitters = lazy(() => import("./pages/search/FindSitters"));
const SitterVerification = lazy(() => import("./pages/verification/SitterVerification"));
const VerifyPhone = lazy(() => import("./pages/verification/VerifyPhone"));
const RoleSelection = lazy(() => import("./pages/register/RoleSelection"));
const ParentRegistration = lazy(() => import("./pages/register/ParentRegistration"));
const SitterRegistration = lazy(() => import("./pages/register/SitterRegistration"));
const Login = lazy(() => import("./pages/Login"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const VerificationQueue = lazy(() => import("./pages/admin/VerificationQueue"));
const ReportsQueue = lazy(() => import("./pages/admin/ReportsQueue"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/AnalyticsDashboard"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const MySitterPosts = lazy(() => import("./pages/sitter-posts/MySitterPosts"));
// const PlatformMonitoring = lazy(() => import("./pages/admin/PlatformMonitoring"));
// const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
// const SystemConfiguration = lazy(() => import("./pages/admin/SystemConfiguration"));

import { AdminRoute } from "./components/auth/AdminRoute";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      logger.error("Query execution failed", {
        action: "react_query.error",
        error,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      logger.error("Mutation execution failed", {
        action: "react_mutation.error",
        error,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes (conservative default)
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3, // Increased from 1 to handle transient network errors
      refetchOnWindowFocus: true, // Refetch when user returns to tab (better data freshness)
    },
  },
});

const App = () => (
  <Sentry.ErrorBoundary
    fallback={GlobalErrorFallback}
    showDialog={false}
  >
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NetworkStatusIndicator />
            <BrowserRouter>
              <PerformanceRouteTracker />
              <SessionTimeoutModal />
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  {/* Need Posts Routes */}
                  <Route path="/needs" element={<BrowseNeeds />} />
                  <Route path="/my-needs" element={<MyNeedPosts />} />
                  <Route path="/my-needs/:needPostId/applications" element={<ViewApplications />} />
                  {/* Bookings Routes */}
                  <Route path="/bookings" element={<MyBookings />} />
                  <Route path="/calendar" element={<CalendarPage />} />

                  {/* Sidebar Aliases */}
                  <Route path="/dashboard" element={<FindSitters />} /> {/* Fallback for dashboard */}
                  <Route path="/need-posts" element={<BrowseNeeds />} />
                  <Route path="/my-sessions" element={<MyBookings />} />
                  <Route path="/sessions" element={<MyBookings />} />
                  <Route path="/stats" element={<EarningsPage />} /> {/* Sitter stats usually earnings */}
                  <Route path="/statistics" element={<EarningsPage />} />
                  {/* Session Routes */}
                  <Route path="/session/:sessionId" element={<ActiveSession />} />
                  <Route path="/session" element={<ActiveSession />} />

                  {/* Parent Routes */}
                  <Route path="/safety" element={<SafetyCenter />} />
                  {/* Chat Routes */}
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/messages/:conversationId" element={<MessagesPage />} />
                  {/* Children Routes */}
                  <Route path="/children" element={<ChildrenPage />} />
                  {/* Review Routes */}
                  <Route path="/review/:sessionId" element={<ReviewPage />} />
                  <Route path="/reviews/:sitterId" element={<SitterReviewsPage />} />
                  {/* Notifications Routes */}
                  <Route path="/notifications" element={<NotificationsPage />} />
                  {/* Settings Routes */}
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Legal Routes */}
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/kvkk" element={<KVKKPage />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  {/* Subscription Routes */}
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  {/* Help Routes */}
                  <Route path="/help" element={<HelpPage />} />
                  {/* Dispute Routes */}
                  <Route path="/disputes" element={<DisputesPage />} />

                  <Route path="/disputes/history" element={<DisputeHistoryPage />} />
                  {/* About Routes */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  {/* Search Routes */}
                  <Route path="/find-sitter" element={<FindSitters />} />
                  {/* Registration Routes */}
                  <Route path="/register" element={<RoleSelection />} />
                  <Route path="/register/parent" element={<ParentRegistration />} />
                  <Route path="/register/sitter" element={<SitterRegistration />} />
                  {/* Verification Routes */}
                  <Route path="/verification" element={<SitterVerification />} />
                  <Route path="/verify-phone" element={<VerifyPhone />} />
                  {/* Sitter Routes */}
                  <Route path="/book/:sitterId" element={<PaymentCheckoutPage />} />
                  <Route path="/checkout/confirmation" element={<PaymentConfirmationPage />} />
                  <Route path="/sitters/:sitterId" element={<SitterProfilePage />} />
                  <Route path="/sitter/:sitterId" element={<SitterProfilePage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/earnings" element={<EarningsPage />} />
                  <Route path="/earnings/history" element={<PayoutHistoryPage />} />
                  <Route path="/my-sitter-posts" element={<MySitterPosts />} />
                  <Route path="/checkout/receipt" element={<PaymentReceiptPage />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/admin/verifications" element={<AdminRoute><VerificationQueue /></AdminRoute>} />
                  <Route path="/admin/reports" element={<AdminRoute><ReportsQueue /></AdminRoute>} />
                  <Route path="/admin/monitoring" element={<AdminRoute><AnalyticsDashboard /></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
