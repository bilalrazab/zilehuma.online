import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";

const db = supabase as any;

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => { load(); }, [currentMonth]);

  const load = async () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const { data } = await db.from('appointments').select('*, clients(full_name)')
      .gte('start_time', start.toISOString()).lte('start_time', end.toISOString()).order('start_time');
    setSessions(data || []);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getSessionsForDay = (day: Date) => sessions.filter(s => isSameDay(parseISO(s.start_time), day));
  const selectedSessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-500', completed: 'bg-emerald-500', cancelled: 'bg-muted-foreground', no_show: 'bg-destructive',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Calendar</h1>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map(day => {
              const daySessions = getSessionsForDay(day);
              const inMonth = day.getMonth() === currentMonth.getMonth();
              const selected = selectedDate && isSameDay(day, selectedDate);
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className={`relative min-h-[3rem] p-1 text-sm rounded-lg transition-colors
                    ${!inMonth ? 'text-muted-foreground/40' : ''}
                    ${isToday(day) ? 'bg-primary/10 font-bold' : ''}
                    ${selected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}
                  `}>
                  <span className="text-xs">{format(day, 'd')}</span>
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      {daySessions.slice(0, 3).map(s => (
                        <div key={s.id} className={`h-1.5 w-1.5 rounded-full ${statusColor[s.status] || 'bg-primary'}`} />
                      ))}
                      {daySessions.length > 3 && <span className="text-[8px] text-muted-foreground">+{daySessions.length - 3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sessions on this day</p>
            ) : (
              <div className="space-y-3">
                {selectedSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/clients/${s.client_id}`)}>
                    <div className={`h-3 w-3 rounded-full ${statusColor[s.status] || 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.clients?.full_name || 'Client'}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(s.start_time), 'h:mm a')} · {s.type} · {s.duration_minutes || 50}min</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'default' : s.status === 'no_show' ? 'destructive' : 'outline'} className="text-xs">{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarPage;
