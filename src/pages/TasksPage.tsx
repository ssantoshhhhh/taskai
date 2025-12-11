
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskStatus, TaskPriority } from '@/types/database';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  List,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pinecone } from '@/lib/pinecone';
import ScrollStack, { ScrollStackItem } from '@/components/ui/ScrollStack';
import StarBorder from '@/components/ui/StarBorder';

const statusConfig: Record<TaskStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  'todo': { label: 'To Do', icon: AlertCircle, color: 'text-muted-foreground' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-warning' },
  'done': { label: 'Done', icon: CheckCircle2, color: 'text-success' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  'low': { label: 'Low', color: 'bg-secondary text-secondary-foreground' },
  'medium': { label: 'Medium', color: 'bg-warning/20 text-warning' },
  'high': { label: 'High', color: 'bg-destructive/20 text-destructive' },
};

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);


  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    due_date: '',
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tasks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
    });
    setDialogOpen(true);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        // Update index in Pinecone (Client Side)
        await pinecone.indexTask({
          id: editingTask.id,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority
        });

        toast({ title: 'Task updated successfully!' });
      } else {
        const { data: taskData, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user!.id,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Index in Pinecone (Client Side)
        if (taskData) {
          await pinecone.indexTask({
            id: taskData.id,
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority
          });
        }

        toast({ title: 'Task created successfully!' });
      }

      setDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save task.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from Pinecone (Client Side)
      pinecone.deleteTask(id);

      toast({ title: 'Task deleted!' });
      fetchTasks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task.',
        variant: 'destructive',
      });
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Tasks</h1>
              <p className="text-muted-foreground">Manage your tasks and stay productive</p>
            </div>

          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            {/* Trigger moved to StarBorder below, Dialog is controlled by open state */}
            <div className="mt-4 mb-4">
              <StarBorder
                as="button"
                className="cursor-pointer"
                color="cyan"
                speed="5s"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </div>
              </StarBorder>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    autoFocus
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTask ? 'Update' : 'Create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="h-[800px] w-full relative">
            <ScrollStack className="h-full w-full no-scrollbar" itemDistance={100} itemStackDistance={30}>
              {tasks.map((task, index) => {
                const StatusIcon = statusConfig[task.status].icon;
                return (
                  <ScrollStackItem key={task.id}>
                    <Card
                      className={cn(
                        "bg-[#0a0a0a] border border-white/10 h-full flex flex-col justify-center transition-all duration-300 shadow-xl text-white",
                      )}
                    >
                      <CardContent className="p-4 sm:p-8">
                        <div className="flex items-start gap-3 sm:gap-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering selection
                              const nextStatus: Record<TaskStatus, TaskStatus> = {
                                'todo': 'in-progress',
                                'in-progress': 'done',
                                'done': 'todo',
                              };
                              updateTaskStatus(task.id, nextStatus[task.status]);
                            }}
                            className={cn(
                              "mt-1 p-1.5 sm:p-2 rounded-full hover:bg-secondary transition-colors",
                              statusConfig[task.status].color
                            )}
                          >
                            <StatusIcon className="w-5 h-5 sm:w-8 sm:h-8" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 sm:gap-4">
                              <div>
                                <h3 className={cn(
                                  "text-lg sm:text-2xl font-bold leading-tight",
                                  task.status === 'done' && "line-through text-muted-foreground"
                                )}>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-sm sm:text-lg text-gray-300 mt-1 sm:mt-2 line-clamp-3">
                                    {task.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-auto sm:w-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(task);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-auto sm:w-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                              <span className={cn(
                                "text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full",
                                priorityConfig[task.priority].color
                              )}>
                                {priorityConfig[task.priority].label}
                              </span>
                              <span className={cn(
                                "text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-secondary",
                                statusConfig[task.status].color
                              )}>
                                {statusConfig[task.status].label}
                              </span>
                              {task.due_date && (
                                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollStackItem>
                );
              })}
            </ScrollStack>
          </div>
        )}
      </div>
    </AppLayout>
  );
}