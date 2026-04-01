import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogNew from "./pages/BlogNew";
import TestimonialNew from "./pages/TestimonialNew";
import ServicePage from "./pages/ServicePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import UnsubscribePage from "./pages/UnsubscribePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import ClientsPage from "./pages/dashboard/ClientsPage";
import ClientFilePage from "./pages/dashboard/ClientFilePage";
import TasksPage from "./pages/dashboard/TasksPage";
import CalendarPage from "./pages/dashboard/CalendarPage";
import ClientSessionsPage from "./pages/dashboard/ClientSessionsPage";
import ClientProgressPage from "./pages/dashboard/ClientProgressPage";
import MessagingPage from "./pages/dashboard/MessagingPage";
import ResourcesPage from "./pages/dashboard/ResourcesPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ClientOnboarding from "./pages/dashboard/ClientOnboarding";
import BookPage from "./pages/BookPage";

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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
