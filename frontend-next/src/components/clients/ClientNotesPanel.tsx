'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { tokens } from '@/lib/design-tokens';
import { 
  StickyNote, 
  Pin, 
  PinOff, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag, 
  X,
  AlertCircle,
  Heart,
  Scissors,
  Calendar,
  FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Types
interface ClientNote {
  id: string;
  client_id: string;
  salon_id: string;
  staff_id: string;
  note_type: 'general' | 'preference' | 'allergy' | 'service_note' | 'follow_up';
  content: string;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  staff_name?: string;
}

interface ClientNotesPanelProps {
  clientId: string;
  salonId: string;
  staffId: string;
}

// Note type configuration
const NOTE_TYPES = [
  { value: 'general', label: 'General', icon: FileText, color: 'bg-slate-500/20 text-slate-300' },
  { value: 'preference', label: 'Preference', icon: Heart, color: 'bg-pink-500/20 text-pink-300' },
  { value: 'allergy', label: 'Allergy', icon: AlertCircle, color: 'bg-red-500/20 text-red-300' },
  { value: 'service_note', label: 'Service Note', icon: Scissors, color: 'bg-blue-500/20 text-blue-300' },
  { value: 'follow_up', label: 'Follow Up', icon: Calendar, color: 'bg-amber-500/20 text-amber-300' },
];

// Helper function for relative timestamps
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return date.toLocaleDateString();
}

// Note type badge component
function NoteTypeBadge({ noteType }: { noteType: string }) {
  const typeConfig = NOTE_TYPES.find(t => t.value === noteType) || NOTE_TYPES[0];
  const Icon = typeConfig.icon;

  return (
    <Badge className={`${typeConfig.color} border-0`}>
      <Icon className="h-3 w-3 mr-1" />
      {typeConfig.label}
    </Badge>
  );
}

// Note card component
function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin 
}: { 
  note: ClientNote;
  onEdit: (note: ClientNote) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
}) {
  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${note.is_pinned ? 'ring-1 ring-gold-500/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <NoteTypeBadge noteType={note.note_type} />
              {note.is_pinned && (
                <Badge className="bg-gold-500/20 text-gold-400 border-gold-500/30">
                  <Pin className="h-3 w-3 mr-1" />Pinned
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{note.content}</p>
            {note.tags && note.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <Tag className="h-3 w-3 text-slate-500" />
                {note.tags.map((tag, idx) => (
                  <Badge key={idx} variant="neutral" className="text-xs border-slate-600 text-slate-400">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span>{note.staff_name || 'Staff'}</span>
              <span>•</span>
              <span>{getRelativeTime(note.created_at)}</span>
              {note.updated_at !== note.created_at && (
                <>
                  <span>•</span>
                  <span>edited {getRelativeTime(note.updated_at)}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-gold-400"
              onClick={() => onTogglePin(note.id)}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-400"
              onClick={() => onEdit(note)}
              title="Edit note"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={() => onDelete(note.id)}
              title="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Note form dialog
function NoteFormDialog({
  open,
  onClose,
  note,
  onSave,
  salonId,
  staffId,
  clientId
}: {
  open: boolean;
  onClose: () => void;
  note: ClientNote | null;
  onSave: (data: Partial<ClientNote>) => void;
  salonId: string;
  staffId: string;
  clientId: string;
}) {
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setNoteType(note.note_type);
      setTags(note.tags || []);
    } else {
      setContent('');
      setNoteType('general');
      setTags([]);
    }
    setTagInput('');
  }, [note, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSave({
      ...(note ? { id: note.id } : {}),
      client_id: clientId,
      salon_id: salonId,
      staff_id: staffId,
      note_type: noteType,
      content: content.trim(),
      tags
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            {note ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-slate-400 text-xs">Note Type</Label>
            <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select note type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {NOTE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-400 text-xs">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[120px]"
              placeholder="Enter note content..."
            />
          </div>

          <div>
            <Label className="text-slate-400 text-xs">Tags</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="bg-slate-800 border-slate-700 text-white flex-1"
                placeholder="Add a tag..."
              />
              <Button type="button" onClick={handleAddTag} variant="secondary" className="border-slate-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="neutral" className="border-slate-600 text-slate-300">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} className="border-slate-700 text-slate-300">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-gold-500 text-slate-950 hover:bg-gold-400"
            disabled={!content.trim()}
          >
            {note ? 'Save Changes' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main ClientNotesPanel component
export type NoteType = 'general' | 'preference' | 'allergy' | 'service_note' | 'follow_up';

function ClientNotesPanel({ clientId, salonId, staffId }: ClientNotesPanelProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch notes
  const fetchNotes = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        salon_id: salonId,
        page: pageNum.toString(),
        limit: '20'
      });

      if (filterType !== 'all') {
        params.append('note_type', filterType);
      }
      if (pinnedOnly) {
        params.append('pinned_only', 'true');
      }

      const response = await fetch(`/api/clients/${clientId}/notes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notes');

      const data = await response.json();

      if (reset) {
        setNotes(data.notes || []);
      } else {
        setNotes(prev => [...prev, ...(data.notes || [])]);
      }
      setHasMore(data.notes?.length === 20);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, salonId, filterType, pinnedOnly, toast]);

  // Search notes
  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      fetchNotes(1, true);
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      const params = new URLSearchParams({
        salon_id: salonId,
        q: query,
        limit: '50'
      });

      const response = await fetch(`/api/clients/${clientId}/notes/search?${params}`);
      if (!response.ok) throw new Error('Failed to search notes');

      const data = await response.json();
      setNotes(data || []);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to search notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, salonId, fetchNotes, toast]);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    fetchNotes(1, true);
  }, [filterType, pinnedOnly]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchNotes(searchQuery);
      } else if (isSearching) {
        setIsSearching(false);
        fetchNotes(1, true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !isSearching) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotes(nextPage);
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, isSearching, page, fetchNotes]);

  // Create/Update note
  const handleSaveNote = async (data: Partial<ClientNote>) => {
    try {
      const isEditing = !!data.id;
      const url = isEditing 
        ? `/api/notes/${data.id}` 
        : `/api/clients/${clientId}/notes`;

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save note');

      toast({
        title: 'Success',
        description: isEditing ? 'Note updated' : 'Note added'
      });

      fetchNotes(1, true);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}?salon_id=${salonId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete note');

      toast({
        title: 'Success',
        description: 'Note deleted'
      });

      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
    }
  };

  // Toggle pin
  const handleTogglePin = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/toggle-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_id: salonId })
      });

      if (!response.ok) throw new Error('Failed to toggle pin');

      const updatedNote = await response.json();
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: updatedNote.is_pinned } : n));

      toast({
        title: 'Success',
        description: updatedNote.is_pinned ? 'Note pinned' : 'Note unpinned'
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle pin',
        variant: 'destructive'
      });
    }
  };

  // Open edit dialog
  const handleEditNote = (note: ClientNote) => {
    setEditingNote(note);
    setNoteDialogOpen(true);
  };

  // Open new note dialog
  const handleNewNote = () => {
    setEditingNote(null);
    setNoteDialogOpen(true);
  };

  return (
    <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-gold-400" />
            Client Notes
          </CardTitle>
          <Button 
            onClick={handleNewNote}
            className="bg-gold-500 text-slate-950 hover:bg-gold-400"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white h-8 text-sm">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">All Types</SelectItem>
                {NOTE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={pinnedOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPinnedOnly(!pinnedOnly)}
              className={pinnedOnly ? 'bg-gold-500 text-slate-950' : 'border-slate-700 text-slate-300'}
            >
              <Pin className="h-3 w-3 mr-1" />
              Pinned
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[400px] pr-2">
          {loading && notes.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-lg bg-slate-800/50">
                  <Skeleton className="h-4 w-20 mb-2 bg-slate-700" />
                  <Skeleton className="h-16 w-full bg-slate-700" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <StickyNote className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs mt-1">Add a note to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                  onTogglePin={handleTogglePin}
                />
              ))}

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="py-4">
                  <Skeleton className="h-20 w-full bg-slate-800" />
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Note Form Dialog */}
      <NoteFormDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        note={editingNote}
        onSave={handleSaveNote}
        salonId={salonId}
        staffId={staffId}
        clientId={clientId}
      />
    </Card>
  );
}
