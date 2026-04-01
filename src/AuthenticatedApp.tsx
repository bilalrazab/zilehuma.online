import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogNew = lazy(() => import("./pages/BlogNew"));
const TestimonialNew = lazy(() => import("./pages/TestimonialNew"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BookPage = lazy(() => import("./pages/BookPage"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const ClientsPage = lazy(() => import("./pages/dashboard/ClientsPage"));
const ClientFilePage = lazy(() => import("./pages/dashboard/ClientFilePage"));
const TasksPage = lazy(() => import("./pages/dashboard/TasksPage"));
const CalendarPage = lazy(() => import("./pages/dashboard/CalendarPage"));
const ClientSessionsPage = lazy(() => import("./pages/dashboard/ClientSessionsPage"));
const ClientProgressPage = lazy(() => import("./pages/dashboard/ClientProgressPage"));
const MessagingPage = lazy(() => import("./pages/dashboard/MessagingPage"));
const ResourcesPage = lazy(() => import("./pages/dashboard/ResourcesPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const ClientOnboarding = lazy(() => import("./pages/dashboard/ClientOnboarding"));

const queryClient = new QueryClient();

const AuthenticatedApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Suspense fallback={null}><Toaster /></Suspense>
      <Suspense fallback={null}><Sonner /></Suspense>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/new" element={<BlogNew />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/testimonial/new" element={<TestimonialNew />} />
            <Route path="/services/:slug" element={<ServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/book-appointment" element={<BookPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientFilePage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="sessions" element={<ClientSessionsPage />} />
              <Route path="progress" element={<ClientProgressPage />} />
              <Route path="messages" element={<MessagingPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="onboarding" element={<ClientOnboarding />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AuthenticatedApp;
