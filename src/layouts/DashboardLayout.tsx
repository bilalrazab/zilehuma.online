import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shouldRouteToOnboarding } from "@/lib/clientLifecycle";

const db = supabase as any;

const DashboardLayout = () => {
  const { user, role, roleLoaded, loading } = useAuth();
  const location = useLocation();
  const [onboardingCheck, setOnboardingCheck] = useState<"checking" | "ok" | "needs_onboarding">("checking");

  useEffect(() => {
    if (!user || loading || !roleLoaded) return;
    // Only check for client role users
    if (role && role !== "client") {
      setOnboardingCheck("ok");
      return;
    }

    // If no role at all (e.g. orphan user), skip onboarding check
    if (!role) {
      setOnboardingCheck("ok");
      return;
    }

    const check = async () => {
      try {
        const { data, error } = await db
          .from("clients")
          .select("id, user_id, status, full_name, phone, gender, date_of_birth, address, emergency_contact, emergency_phone, notes")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && shouldRouteToOnboarding(data)) {
          setOnboardingCheck("needs_onboarding");
        } else {
          setOnboardingCheck("ok");
        }
      } catch {
        setOnboardingCheck("ok");
      }
    };

    check();
  }, [user, role, roleLoaded, loading]);

  if (loading || !roleLoaded || onboardingCheck === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirect clients who haven't completed onboarding (but not if already on onboarding page)
  if (onboardingCheck === "needs_onboarding" && location.pathname !== "/dashboard/onboarding") {
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  return (
    <SidebarProvider>
      <SEO
        title="Dashboard"
        description="Private dashboard"
        canonical="https://zilehuma.online/dashboard"
        noIndex={true}
      />
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardNav />
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;