import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar } from "lucide-react";

const db = supabase as any;

const TreatmentPlansPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      const { data: clientRecord } = await db.from('clients').select('id').eq('user_id', user?.id).single();
      if (clientRecord) {
        const { data } = await db.from('treatment_plans').select('*').eq('client_id', clientRecord.id).order('created_at', { ascending: false });
        setPlans(data || []);
      }
    };
    if (user) loadPlans();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">My Treatment Plans</h1>
        <p className="text-muted-foreground text-sm mt-1">View your therapy goals and progress</p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No treatment plans yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your therapist will create a treatment plan during your sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <Badge variant={plan.status === 'active' ? 'default' : plan.status === 'completed' ? 'outline' : 'secondary'}>{plan.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.description && <p className="text-muted-foreground text-sm">{plan.description}</p>}
                {plan.goals && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="font-medium text-sm mb-1">Goals</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{plan.goals}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  {plan.start_date && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Started: {new Date(plan.start_date).toLocaleDateString()}</span>
                  )}
                  {plan.review_date && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Review: {new Date(plan.review_date).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentPlansPage;
