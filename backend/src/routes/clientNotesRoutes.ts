import { Router } from 'express';
import clientNoteService from '../services/ClientNoteService';
import { validateUUID } from '../middleware/validateUUID';

const router = Router();
router.use(validateUUID);

// GET /api/clients/:clientId/notes - List notes with pagination
router.get('/:clientId/notes', async (req, res) => {
  try {
    const { clientId } = req.params;
    const salonId = req.query.salon_id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const noteType = req.query.note_type as string;
    const pinnedOnly = req.query.pinned_only === 'true';

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const result = await clientNoteService.getClientNotes(clientId, salonId, {
      page,
      limit,
      noteType,
      pinnedOnly
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching client notes:', err);
    res.status(500).json({ error: 'Failed to fetch client notes' });
  }
});

// POST /api/clients/:clientId/notes - Create note
router.post('/:clientId/notes', async (req, res) => {
  try {
    const { clientId } = req.params;
    const salonId = req.body.salon_id;
    const staffId = req.body.staff_id;

    if (!salonId || !staffId) {
      return res.status(400).json({ error: 'salon_id and staff_id are required' });
    }

    const note = await clientNoteService.createNote(clientId, salonId, staffId, req.body);
    res.status(201).json(note);
  } catch (err) {
    console.error('Error creating client note:', err);
    if (err instanceof Error && err.message.includes('maximum length')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create client note' });
  }
});

// GET /api/clients/:clientId/notes/search?q=term - Full-text search
router.get('/:clientId/notes/search', async (req, res) => {
  try {
    const { clientId } = req.params;
    const salonId = req.query.salon_id as string;
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term (q) is required' });
    }

    const notes = await clientNoteService.searchNotes(clientId, salonId, searchTerm, limit);
    res.json(notes);
  } catch (err) {
    console.error('Error searching client notes:', err);
    res.status(500).json({ error: 'Failed to search client notes' });
  }
});

// PATCH /api/notes/:noteId - Update note
router.patch('/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const salonId = req.body.salon_id;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const note = await clientNoteService.updateNote(noteId, salonId, req.body);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    console.error('Error updating client note:', err);
    if (err instanceof Error && err.message.includes('maximum length')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update client note' });
  }
});

// DELETE /api/notes/:noteId - Delete note
router.delete('/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const salonId = req.query.salon_id as string;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const deleted = await clientNoteService.deleteNote(noteId, salonId);
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting client note:', err);
    res.status(500).json({ error: 'Failed to delete client note' });
  }
});

// Additional endpoints for convenience

// GET /api/notes/:noteId - Get single note
router.get('/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const salonId = req.query.salon_id as string;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const note = await clientNoteService.getNoteById(noteId, salonId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes/:noteId/toggle-pin - Toggle pin status
router.post('/notes/:noteId/toggle-pin', async (req, res) => {
  try {
    const { noteId } = req.params;
    const salonId = req.body.salon_id;

    if (!salonId) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const note = await clientNoteService.togglePinNote(noteId, salonId);
    res.json(note);
  } catch (err) {
    console.error('Error toggling pin status:', err);
    if (err instanceof Error && err.message === 'Note not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to toggle pin status' });
  }
});

// POST /api/notes/:noteId/tags - Add tags to note
router.post('/notes/:noteId/tags', async (req, res) => {
  try {
    const { noteId } = req.params;
    const salonId = req.body.salon_id;
    const tags = req.body.tags;

    if (!salonId || !tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'salon_id and tags array are required' });
    }

    const note = await clientNoteService.addTagsToNote(noteId, salonId, tags);
    res.json(note);
  } catch (err) {
    console.error('Error adding tags to note:', err);
    if (err instanceof Error && err.message === 'Note not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to add tags to note' });
  }
});

// DELETE /api/notes/:noteId/tags - Remove tags from note
router.delete('/notes/:noteId/tags', async (req, res) => {
  try {
    const { noteId } = req.params;
    const salonId = req.body.salon_id;
    const tagsToRemove = req.body.tags;

    if (!salonId || !tagsToRemove || !Array.isArray(tagsToRemove)) {
      return res.status(400).json({ error: 'salon_id and tags array are required' });
    }

    const note = await clientNoteService.removeTagsFromNote(noteId, salonId, tagsToRemove);
    res.json(note);
  } catch (err) {
    console.error('Error removing tags from note:', err);
    if (err instanceof Error && err.message === 'Note not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to remove tags from note' });
  }
});

export default router;
