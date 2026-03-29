import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogNew from "./pages/BlogNew";
import TestimonialNew from "./pages/TestimonialNew";
import ServicePage from "./pages/ServicePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ClientsPage from "./pages/dashboard/ClientsPage";
import ClientProfilePage from "./pages/dashboard/ClientProfilePage";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import SessionNotesPage from "./pages/dashboard/SessionNotesPage";
import MessagingPage from "./pages/dashboard/MessagingPage";
import ResourcesPage from "./pages/dashboard/ResourcesPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import AuditLogPage from "./pages/dashboard/AuditLogPage";
import MoodTrackerPage from "./pages/dashboard/MoodTrackerPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import TreatmentPlansPage from "./pages/dashboard/TreatmentPlansPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/new" element={<BlogNew />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/testimonial/new" element={<TestimonialNew />} />
            <Route path="/services/:slug" element={<ServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientProfilePage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="sessions" element={<SessionNotesPage />} />
              <Route path="messages" element={<MessagingPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
              <Route path="mood" element={<MoodTrackerPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="treatment-plans" element={<TreatmentPlansPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
