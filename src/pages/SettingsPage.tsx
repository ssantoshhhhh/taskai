import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import MagicBento from '@/components/ui/MagicBento';
import { User, Clock, Brain, Bell, Shield, Wallet, Link, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    work_hours: profile?.work_hours || '',
    focus_style: profile?.focus_style || '',
    reminder_time: profile?.reminder_time || '',
  });

  // Keep formData synced with profile if it loads later
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        work_hours: profile.work_hours || '',
        focus_style: profile.focus_style || '',
        reminder_time: profile.reminder_time || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          work_hours: formData.work_hours || null,
          focus_style: formData.focus_style || null,
          reminder_time: formData.reminder_time || null,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated.',
      });
      setActiveDialog(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const cardData = [
    {
      color: '#0a0a0a',
      title: 'Profile',
      description: 'Update name & email',
      label: 'Account',
      onClick: () => setActiveDialog('profile')
    },
    {
      color: '#0a0a0a',
      title: 'Work Hours',
      description: 'Set your availability',
      label: 'Preferences',
      onClick: () => setActiveDialog('work')
    },
    {
      color: '#0a0a0a',
      title: 'Focus Style',
      description: 'Configure AI assistant',
      label: 'AI Behavior',
      onClick: () => setActiveDialog('focus')
    },
    {
      color: '#0a0a0a',
      title: 'Notifications',
      description: 'Manage alerts & reminders',
      label: 'Alerts',
      onClick: () => setActiveDialog('notifications')
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in pb-20">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">Settings</h1>
          <p className="text-xl text-muted-foreground">Manage your account and preferences with AI</p>
        </div>

        <div className="w-full max-w-5xl">
          <MagicBento
            cardData={cardData}
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
          />
        </div>

        {/* Dialogs for Settings */}

        {/* Profile Dialog */}
        <Dialog open={activeDialog === 'profile'} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Profile Settings</DialogTitle>
              <DialogDescription>Update your personal information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ''} disabled className="bg-white/5 border-white/10 text-gray-400" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Work Hours Dialog */}
        <Dialog open={activeDialog === 'work'} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Work Preferences</DialogTitle>
              <DialogDescription>Set your working hours for better planning</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Work Schedule</Label>
                <Select value={formData.work_hours} onValueChange={(v) => setFormData({ ...formData, work_hours: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select hours" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                    <SelectItem value="9-5">9 AM - 5 PM</SelectItem>
                    <SelectItem value="8-4">8 AM - 4 PM</SelectItem>
                    <SelectItem value="10-6">10 AM - 6 PM</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Focus Style Dialog */}
        <Dialog open={activeDialog === 'focus'} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>AI Focus Style</DialogTitle>
              <DialogDescription>How should AI organize your tasks?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Focus Methodology</Label>
                <Select value={formData.focus_style} onValueChange={(v) => setFormData({ ...formData, focus_style: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                    <SelectItem value="deep-work">Deep Work</SelectItem>
                    <SelectItem value="pomodoro">Pomodoro</SelectItem>
                    <SelectItem value="time-boxing">Time Boxing</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notifications Dialog */}
        <Dialog open={activeDialog === 'notifications'} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>Daily summary settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Daily Reminder Time</Label>
                <Input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}