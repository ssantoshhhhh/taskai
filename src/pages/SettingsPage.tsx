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

  const getWorkHoursLabel = (val: string) => {
    switch (val) {
      case '9-5': return '9 AM - 5 PM';
      case '8-4': return '8 AM - 4 PM';
      case '10-6': return '10 AM - 6 PM';
      case 'flexible': return 'Flexible';
      case 'night': return 'Night Shift';
      default: return 'Not set';
    }
  };




  const getFocusStyleLabel = (val: string) => {
    if (!val) return 'Not set';
    return val.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const cardData = [
    {
      color: '#0a0a0a',
      title: 'Profile',
      description: profile?.name || 'Update name & email',
      label: 'Account',
      onClick: () => setActiveDialog('profile')
    },
    {
      color: '#0a0a0a',
      title: 'Work Hours',
      description: getWorkHoursLabel(profile?.work_hours || ''),
      label: 'Preferences',
      onClick: () => setActiveDialog('work')
    },
    {
      color: '#0a0a0a',
      title: 'Focus Style',
      description: getFocusStyleLabel(profile?.focus_style || ''),
      label: 'AI Behavior',
      onClick: () => setActiveDialog('focus')
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in pb-20 relative overflow-hidden">
        {/* Ambient Background Orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="text-center mb-16 relative z-10 space-y-4">
          <div className="inline-block p-1 rounded-full bg-white/5 mb-4 backdrop-blur-sm border border-white/10">
            <span className="px-3 py-1 text-xs font-medium text-purple-300">Personalize Experience</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400 tracking-tight">Settings</h1>
          <p className="text-xl text-gray-400 font-light max-w-lg mx-auto">Manage your account and customize how AI interacts with your workflow.</p>
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
          <DialogContent className="bg-black/80 backdrop-blur-xl border-purple-500/20 text-white shadow-2xl shadow-purple-900/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Profile Settings</DialogTitle>
              <DialogDescription className="text-gray-400">Update your personal information</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Display Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input value={profile?.email || ''} disabled className="bg-white/5 border-white/10 text-gray-500 cursor-not-allowed" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-900/20 transition-all duration-300 transform hover:scale-105">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Work Hours Dialog */}
        <Dialog open={activeDialog === 'work'} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="bg-black/80 backdrop-blur-xl border-blue-500/20 text-white shadow-2xl shadow-blue-900/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Work Preferences</DialogTitle>
              <DialogDescription className="text-gray-400">Set your working hours for better planning</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Work Schedule</Label>
                <Select value={formData.work_hours} onValueChange={(v) => setFormData({ ...formData, work_hours: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-300">
                    <SelectValue placeholder="Select hours" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 backdrop-blur-xl border-white/10 text-white">
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
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-blue-900/20 transition-all duration-300 transform hover:scale-105">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Focus Style Dialog */}
        <Dialog open={activeDialog === 'focus'} onOpenChange={() => setActiveDialog(null)}>
          <DialogContent className="bg-black/80 backdrop-blur-xl border-pink-500/20 text-white shadow-2xl shadow-pink-900/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">AI Focus Style</DialogTitle>
              <DialogDescription className="text-gray-400">How should AI organize your tasks?</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Focus Methodology</Label>
                <Select value={formData.focus_style} onValueChange={(v) => setFormData({ ...formData, focus_style: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-pink-500/50 focus:ring-pink-500/20 transition-all duration-300">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 backdrop-blur-xl border-white/10 text-white">
                    <SelectItem value="deep-work">Deep Work</SelectItem>
                    <SelectItem value="pomodoro">Pomodoro</SelectItem>
                    <SelectItem value="time-boxing">Time Boxing</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white border-0 shadow-lg shadow-pink-900/20 transition-all duration-300 transform hover:scale-105">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notifications Dialog */}


      </div>
    </AppLayout>
  );
}