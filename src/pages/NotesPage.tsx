import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Note } from '@/types/database';
import { Plus, Trash2, Loader2, FileText, Database, RefreshCw, Pencil, X } from 'lucide-react';
import { pinecone } from '@/lib/pinecone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Cubes from '@/components/ui/Cubes';

export default function NotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Dialog State
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  // Sync editContent with selectedNote when opening edit mode
  useEffect(() => {
    if (selectedNote && isEditing) {
      setEditContent(selectedNote.content);
    }
  }, [isEditing, selectedNote]);

  const handleUpdateNote = async () => {
    if (!selectedNote || !editContent.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({ content: editContent.trim() })
        .eq('id', selectedNote.id);

      if (error) throw error;

      // Update Pinecone
      try {
        await pinecone.indexNote({
          id: selectedNote.id,
          content: editContent.trim()
        });
      } catch (err) {
        console.error("Pinecone update falied", err);
      }

      toast({ title: 'Note updated!' });

      // Update local state
      setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, content: editContent.trim() } : n));
      setSelectedNote({ ...selectedNote, content: editContent.trim() });
      setIsEditing(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to update note.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as Note[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: 'Error',
        description: 'Note content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // First save to database
      const { data: noteData, error } = await supabase
        .from('notes')
        .insert({
          user_id: user!.id,
          content: newNote.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Then index in Pinecone (Client Side)
      if (noteData) {
        await pinecone.indexNote({
          id: noteData.id,
          content: newNote.trim()
        });
      }

      toast({ title: 'Note created!' });
      setNewNote('');
      fetchNotes();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create note (Check Console)',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from Pinecone (Client Side)
      pinecone.deleteNote(id);

      toast({ title: 'Note deleted!' });
      fetchNotes();
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note.',
        variant: 'destructive',
      });
    }
  };

  const syncAllNotes = async () => {
    setSyncing(true);
    toast({ title: "Sync Started", description: "This may take a while to respect API limits..." });
    try {
      const { data: allNotes } = await supabase.from('notes').select('*');
      if (allNotes) {
        let count = 0;
        for (const note of allNotes) {
          // Index the note
          await pinecone.indexNote({ id: note.id, content: note.content });
          count++;

          // Add a 5-second delay to avoid Google API Rate Limits (429) - 12 requests/min
          if (count < allNotes.length) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        toast({ title: `Successfully synced ${count} notes to AI memory!` });
      }
    } catch (error: any) {
      console.error("Sync Error:", error);
      toast({
        title: 'Sync failed',
        description: error.message || "Check console for details",
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
            <p className="text-muted-foreground mt-1">
              Capture your thoughts and let AI remember them.
            </p>
          </div>
          <Card className="bg-primary/5 border-primary/20 w-full md:w-auto">
            <CardContent className="py-2 px-4 flex items-center gap-3">
              <Database className="w-4 h-4 text-primary" />
              <div className="text-xs">
                <span className="font-semibold block">AI Context Enabled</span>
                <span className="text-muted-foreground">Notes sync to Pinecone</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-2 h-8 w-8" onClick={syncAllNotes} disabled={syncing}>
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* New Note Input */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <Card className="relative bg-background/80 backdrop-blur-xl border-white/10 shadow-xl">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Note
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What's on your mind?..."
                className="min-h-[60px] border-none bg-transparent resize-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50 p-0"
                rows={newNote ? 3 : 1}
              />
              <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                <Button
                  onClick={createNote}
                  disabled={saving || !newNote.trim()}
                  size="sm" // Keeping small size but making it stand out
                  className="rounded-full px-6 transition-all duration-300 bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-900/20"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Create Note
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View/Edit Dialog */}
        <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
          <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 text-gray-100 shadow-2xl p-0 overflow-hidden gap-0 h-[600px] flex flex-col">

            {/* Background Effect */}
            <div className="absolute inset-0 z-0">
              <Cubes
                gridSize={12}
                // cubeSize removed for responsive full fill
                maxAngle={20}
                radius={5}
                borderStyle="1px solid rgba(125, 249, 255, 0.3)"
                faceColor="rgba(0,0,0,0.1)"
                rippleColor="#7df9ff"
                rippleSpeed={1}
                autoAnimate={true}
                className="w-full h-full opacity-80"
              />
            </div>

            {/* Main Content Wrapper (Relative + Z-Index) */}
            <div className="relative z-10 flex flex-col h-full bg-black/10 backdrop-blur-[1px] pointer-events-none">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-transparent pointer-events-auto">
                <DialogTitle className="text-lg font-medium flex items-center gap-2">
                  {isEditing ? <Pencil className="w-4 h-4 text-cyan-400" /> : <FileText className="w-4 h-4 text-cyan-400" />}
                  {isEditing ? 'Editing Note' : 'View Note'}
                </DialogTitle>
                {selectedNote && (
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    {new Date(selectedNote.created_at).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar pointer-events-auto">
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-full h-full bg-black/40 border-white/10 text-gray-100 resize-none focus-visible:ring-cyan-500/30 text-base leading-relaxed p-4 rounded-lg backdrop-blur-md"
                    placeholder="Type your note content here..."
                  />
                ) : (
                  <div className="min-h-full whitespace-pre-wrap text-gray-200 leading-relaxed text-base p-2 font-light tracking-wide drop-shadow-md">
                    {selectedNote?.content}
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 py-4 bg-black/40 border-t border-white/5 flex flex-row justify-between items-center sm:justify-between backdrop-blur-md z-20 pointer-events-auto">
                {isEditing ? (
                  <div className="flex w-full justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-white/10 hover:text-white">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateNote} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 text-white min-w-[100px]">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => selectedNote && deleteNote(selectedNote.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-white text-black hover:bg-gray-200 border-none font-semibold transition-colors shadow-lg shadow-white/10"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Note
                      </Button>
                      <Button variant="ghost" onClick={() => setSelectedNote(null)}>
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))
          ) : notes.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                <FileText className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg">No notes yet</p>
              <p className="text-sm opacity-60">Create one above to get started</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsEditing(false);
                }}
                className="group relative aspect-square cursor-pointer active:scale-[0.98] transition-all duration-300"
              >
                {/* Card Container */}
                <div className="absolute inset-0 bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden group-hover:border-white/30 group-hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] transition-all duration-500 flex flex-col">

                  {/* Glare Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0">
                    <div className="absolute top-0 -left-[100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="flex-1 mask-linear-fade overflow-hidden">
                      <p className="text-gray-400 text-sm font-light leading-relaxed whitespace-pre-wrap line-clamp-[8] group-hover:text-gray-100 transition-colors duration-300">
                        {note.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 mt-auto flex justify-between items-center group-hover:border-white/20 transition-colors duration-300">
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium group-hover:text-white/80 transition-all">
                        {new Date(note.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>

                      <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-white/20">
                        <Pencil className="w-3 h-3 text-white/70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}