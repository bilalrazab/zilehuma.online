import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";

const db = supabase as any;
const moodEmojis = ['😢', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳'];
const moodLabels = ['Terrible', 'Very Bad', 'Bad', 'Down', 'Okay', 'Good', 'Great', 'Very Good', 'Amazing', 'Incredible'];
const moodColors = [
  'bg-red-100 border-red-200', 'bg-red-50 border-red-100', 'bg-orange-50 border-orange-100',
  'bg-amber-50 border-amber-100', 'bg-yellow-50 border-yellow-100', 'bg-lime-50 border-lime-100',
  'bg-green-50 border-green-100', 'bg-emerald-50 border-emerald-100', 'bg-teal-50 border-teal-100',
  'bg-cyan-50 border-cyan-100',
];

const MoodTrackerPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await db.from('mood_entries').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(30);
    setEntries(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleLog = async () => {
    setSaving(true);
    const { error } = await db.from('mood_entries').insert({ user_id: user?.id, mood, note: note || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
    toast({ title: `Mood logged: ${moodEmojis[mood - 1]} ${moodLabels[mood - 1]}` });
    setNote("");
    setMood(5);
    setSaving(false);
    load();
  };

  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: e.mood,
  }));

  const avgMood = entries.length > 0 ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1) : '—';
  const todayEntry = entries.find(e => new Date(e.created_at).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Smile className="h-6 w-6 text-primary" /> Mood Tracker
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your emotional well-being over time</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{entries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{avgMood}</p>
            <p className="text-xs text-muted-foreground mt-1">Average Mood</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            {todayEntry ? (
              <>
                <p className="text-3xl">{moodEmojis[(todayEntry.mood || 5) - 1]}</p>
                <p className="text-xs text-muted-foreground mt-1">Today's Mood</p>
              </>
            ) : (
              <>
                <p className="text-3xl">❓</p>
                <p className="text-xs text-muted-foreground mt-1">Not logged today</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Mood */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">How are you feeling?</CardTitle>
          <CardDescription>Select your mood and optionally add a note</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-end gap-1 flex-wrap">
            {moodEmojis.map((emoji, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-200 ${
                  mood === i + 1 ? 'scale-125 bg-primary/10 shadow-md ring-2 ring-primary/20' : 'opacity-40 hover:opacity-80 hover:scale-105'
                }`}>
                <span className="text-2xl sm:text-3xl">{emoji}</span>
              </button>
            ))}
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              {moodEmojis[mood - 1]} {moodLabels[mood - 1]} · {mood}/10
            </Badge>
          </div>
          <Textarea placeholder="What's on your mind? (optional)" value={note} onChange={e => setNote(e.target.value)} rows={2} />
          <Button onClick={handleLog} className="w-full" disabled={saving}>{saving ? "Saving..." : "Log Mood"}</Button>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Mood Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[1, 10]} className="text-xs" />
                <Tooltip />
                <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#moodGrad)" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {entries.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" /> Recent Entries
          </h3>
          <div className="space-y-2">
            {entries.map(e => (
              <Card key={e.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-3xl flex-shrink-0">{moodEmojis[(e.mood || 5) - 1]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{moodLabels[(e.mood || 5) - 1]}</p>
                      <Badge variant="outline" className="text-xs">{e.mood}/10</Badge>
                    </div>
                    {e.note && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{e.note}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTrackerPage;
