import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const db = supabase as any;
const moodEmojis = ['😢', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳'];

const MoodTrackerPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const { data } = await db.from('mood_entries').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(30);
    setEntries(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleLog = async () => {
    const { error } = await db.from('mood_entries').insert({ user_id: user?.id, mood, notes: notes || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Mood logged!" });
    setNotes("");
    setMood(5);
    load();
  };

  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.created_at).toLocaleDateString(),
    mood: e.mood,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
        <Smile className="h-6 w-6 text-primary" /> Mood Tracker
      </h1>
      <Card>
        <CardHeader><CardTitle>How are you feeling?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-2xl flex-wrap gap-1">
            {moodEmojis.map((emoji, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`p-2 rounded-full transition-all ${mood === i + 1 ? 'scale-125 bg-primary/10' : 'opacity-50 hover:opacity-100'}`}>
                {emoji}
              </button>
            ))}
          </div>
          <p className="text-center text-muted-foreground">Your mood: {mood}/10</p>
          <Textarea placeholder="Any notes about how you're feeling?" value={notes} onChange={e => setNotes(e.target.value)} />
          <Button onClick={handleLog} className="w-full">Log Mood</Button>
        </CardContent>
      </Card>

      {chartData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Mood History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {entries.map(e => (
          <Card key={e.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{moodEmojis[(e.mood || 5) - 1]}</span>
              <div>
                <p className="font-medium">{e.mood}/10</p>
                {e.notes && <p className="text-sm text-muted-foreground">{e.notes}</p>}
              </div>
              <span className="ml-auto text-sm text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MoodTrackerPage;
