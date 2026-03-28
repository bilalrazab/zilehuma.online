import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

const db = supabase as any;

const AuditLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }: any) => setLogs(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Audit Log</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                    <TableCell>{l.entity_type}</TableCell>
                    <TableCell className="max-w-xs truncate">{l.details ? JSON.stringify(l.details) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No audit logs yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogPage;
