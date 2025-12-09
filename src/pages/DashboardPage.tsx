import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Task, Plan } from '@/types/database';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import StarBorder from '@/components/ui/StarBorder';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [latestPlan, setLatestPlan] = useState<Plan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData as Task[]);
      }

      // Fetch latest plan
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData) {
        setLatestPlan(planData as Plan);
      }
    } finally {
      setLoading(false);
    }
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
  };

  const generatePlan = async () => {
    if (tasks.length === 0) {
      toast({
        title: 'No Tasks',
        description: 'Add some tasks first to generate a smart plan.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: {
          tasks: tasks.filter(t => t.status !== 'done'),
          timeFrame: 'today'
        }
      });

      if (error) throw error;

      if (data?.plan) {
        // Save plan to database
        const { data: savedPlan, error: saveError } = await supabase
          .from('plans')
          .insert({
            user_id: user!.id,
            generated_text: data.plan,
            source_task_ids: tasks.filter(t => t.status !== 'done').map(t => t.id)
          })
          .select()
          .single();

        if (!saveError && savedPlan) {
          setLatestPlan(savedPlan as Plan);
        }

        toast({
          title: 'Plan Generated!',
          description: 'Your AI-powered productivity plan is ready.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  const reviewProgress = async () => {
    setLoadingReview(true);
    try {
      const { data, error } = await supabase.functions.invoke('review-progress', {
        body: { tasks }
      });

      if (error) throw error;

      if (data?.review) {
        setReview(data.review);
        toast({
          title: 'Review Complete',
          description: 'AI has analyzed your progress.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingReview(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: number, colorClass: string }) => (
    <div className="relative group overflow-hidden rounded-2xl bg-black/20 border border-white/5 p-6 hover:bg-black/30 transition-all duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-bold font-mono tracking-tight text-white mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${colorClass} opacity-50`} />
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2 font-light">
              Welcome back, <span className="text-cyan-400">{profile?.name?.split(' ')[0] || 'Member'}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Total Tasks"
            value={taskStats.total}
            colorClass="from-blue-500 to-cyan-500 text-blue-500"
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={taskStats.inProgress}
            colorClass="from-yellow-500 to-orange-500 text-yellow-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={taskStats.done}
            colorClass="from-green-500 to-emerald-500 text-green-500"
          />
          <StatCard
            icon={AlertCircle}
            label="High Priority"
            value={taskStats.highPriority}
            colorClass="from-red-500 to-pink-500 text-red-500"
          />
        </div>

        {/* AI Actions Area */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main Feature: Smart Plan */}
          <Card className="lg:col-span-2 bg-[#0a0a0a] border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />

            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Smart Plan</CardTitle>
                    <CardDescription>Generate an optimized schedule for your day</CardDescription>
                  </div>
                </div>
                <StarBorder
                  as="button"
                  color="cyan"
                  speed="4s"
                  onClick={generatePlan}
                  disabled={loadingPlan}
                  className="cursor-pointer scale-90 sm:scale-100"
                >
                  <span className="text-sm font-semibold flex items-center gap-2">
                    {loadingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-cyan-400" />}
                    {loadingPlan ? 'Generating...' : 'Generate Plan'}
                  </span>
                </StarBorder>
              </div>
            </CardHeader>

            <CardContent>
              {latestPlan ? (
                <div className="mt-4 p-6 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                    <span className="text-xs font-mono text-cyan-400/80">
                      GENERATED PLAN • {new Date(latestPlan.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-300 font-light leading-relaxed">
                      {latestPlan.generated_text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-white/5 rounded-xl">
                  <Target className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-muted-foreground max-w-md">
                    No plan generated for today yet. Use the button above to have AI analyze your tasks and create a schedule.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary Feature: Progress Review */}
          <Card className="bg-[#0a0a0a] border-white/10 shadow-xl relative overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Progress Review</CardTitle>
                  <CardDescription>Analyze your productivity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1">
                {review ? (
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {review}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-6 text-center text-muted-foreground text-sm italic">
                    "Success is not final, failure is not fatal: it is the courage to continue that counts."
                  </div>
                )}
              </div>

              <div className="mt-6">
                <StarBorder
                  as="button"
                  color="cyan"
                  speed="3s"
                  className="w-full cursor-pointer"
                  onClick={reviewProgress}
                  disabled={loadingReview}
                >
                  <div className="flex items-center justify-center gap-2">
                    {loadingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Review Progress
                      </>
                    )}
                  </div>
                </StarBorder>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}