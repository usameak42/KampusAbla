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

const PerformanceRouteTracker = (): null => {
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
const SitterProfile = lazy(() => import("./pages/profile/SitterProfile"));

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
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const BookingDetail = lazy(() => import("./pages/bookings/BookingDetail"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const VerificationQueue = lazy(() => import("./pages/admin/VerificationQueue"));
const ReportsQueue = lazy(() => import("./pages/admin/ReportsQueue"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/AnalyticsDashboard"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminErrorLogs = lazy(() => import("./pages/admin/AdminErrorLogs"));
const MySitterPosts = lazy(() => import("./pages/sitter-posts/MySitterPosts"));
// const PlatformMonitoring = lazy(() => import("./pages/admin/PlatformMonitoring"));
// const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
// const SystemConfiguration = lazy(() => import("./pages/admin/SystemConfiguration"));

import { AdminRoute } from "./components/auth/AdminRoute";
import { PrivateRoute } from "./components/auth/PrivateRoute";

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
                  {/* Need Posts Routes - auth required for management */}
                  <Route path="/needs" element={<BrowseNeeds />} />
                  <Route path="/need-posts" element={<BrowseNeeds />} />
                  <Route path="/my-needs" element={<PrivateRoute><MyNeedPosts /></PrivateRoute>} />
                  <Route path="/my-needs/:needPostId/applications" element={<PrivateRoute><ViewApplications /></PrivateRoute>} />
                  {/* Bookings Routes */}
                  <Route path="/bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
                  <Route path="/bookings/:bookingId" element={<PrivateRoute><BookingDetail /></PrivateRoute>} />
                  <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                  {/* /jobpost is a sitter-specific alias for bookings/sessions */}
                  <Route path="/jobpost" element={<PrivateRoute><MyBookings /></PrivateRoute>} />

                  {/* Sidebar Aliases */}
                  <Route path="/dashboard" element={<PrivateRoute><FindSitters /></PrivateRoute>} />
                  <Route path="/my-sessions" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
                  <Route path="/sessions" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
                  <Route path="/stats" element={<PrivateRoute><EarningsPage /></PrivateRoute>} />
                  <Route path="/statistics" element={<PrivateRoute><EarningsPage /></PrivateRoute>} />
                  {/* Session Routes */}
                  <Route path="/session/:sessionId" element={<PrivateRoute><ActiveSession /></PrivateRoute>} />
                  <Route path="/session" element={<PrivateRoute><ActiveSession /></PrivateRoute>} />

                  {/* Parent Routes */}
                  <Route path="/safety" element={<PrivateRoute><SafetyCenter /></PrivateRoute>} />
                  {/* Chat Routes */}
                  <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                  <Route path="/messages/:conversationId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                  {/* Children Routes */}
                  <Route path="/children" element={<PrivateRoute><ChildrenPage /></PrivateRoute>} />
                  <Route path="/profile/children/add" element={<PrivateRoute><ChildrenPage /></PrivateRoute>} />
                  {/* Review Routes - reading reviews is public, writing requires auth */}
                  <Route path="/review/:sessionId" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
                  <Route path="/reviews/:sitterId" element={<SitterReviewsPage />} />
                  {/* Notifications Routes */}
                  <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                  {/* Settings Routes */}
                  <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                  {/* Legal Routes - public */}
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/kvkk" element={<KVKKPage />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  {/* Subscription Routes */}
                  <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
                  {/* Help Routes - public */}
                  <Route path="/help" element={<HelpPage />} />
                  {/* Dispute Routes */}
                   <Route path="/disputes" element={<PrivateRoute><DisputesPage /></PrivateRoute>} />
                   <Route path="/disputes/new" element={<PrivateRoute><DisputeIntakePage /></PrivateRoute>} />
                   <Route path="/disputes/history" element={<PrivateRoute><DisputeHistoryPage /></PrivateRoute>} />
                  {/* About Routes - public */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  {/* Search Routes - public (browse without login) */}
                  <Route path="/find-sitter" element={<FindSitters />} />
                  {/* Registration Routes - public */}
                  <Route path="/register" element={<RoleSelection />} />
                  <Route path="/register/parent" element={<ParentRegistration />} />
                  <Route path="/register/sitter" element={<SitterRegistration />} />
                  {/* Verification Routes - auth required */}
                  <Route path="/verification" element={<PrivateRoute><SitterVerification /></PrivateRoute>} />
                  <Route path="/verify-phone" element={<PrivateRoute><VerifyPhone /></PrivateRoute>} />
                  {/* Sitter & Payment Routes */}
                  <Route path="/book/:sitterId" element={<PrivateRoute><PaymentCheckoutPage /></PrivateRoute>} />
                  <Route path="/checkout/confirmation" element={<PrivateRoute><PaymentConfirmationPage /></PrivateRoute>} />
                  <Route path="/sitters/:sitterId" element={<SitterProfilePage />} />
                  <Route path="/sitter/:sitterId" element={<SitterProfilePage />} />
                  <Route path="/profile" element={<PrivateRoute><SitterProfile /></PrivateRoute>} />
                  <Route path="/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
                  <Route path="/earnings" element={<PrivateRoute><EarningsPage /></PrivateRoute>} />
                  <Route path="/earnings/history" element={<PrivateRoute><PayoutHistoryPage /></PrivateRoute>} />
                  <Route path="/my-sitter-posts" element={<PrivateRoute><MySitterPosts /></PrivateRoute>} />
                  <Route path="/checkout/receipt" element={<PrivateRoute><PaymentReceiptPage /></PrivateRoute>} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/unauthorized" element={<NotFound />} />
                  <Route path="/unauthorized" element={<NotFound />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                  <Route path="/admin/verifications" element={<AdminRoute><VerificationQueue /></AdminRoute>} />
                  <Route path="/admin/reports" element={<AdminRoute><ReportsQueue /></AdminRoute>} />
                  <Route path="/admin/monitoring" element={<AdminRoute><AnalyticsDashboard /></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                  <Route path="/admin/error-logs" element={<AdminRoute><AdminErrorLogs /></AdminRoute>} />

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
