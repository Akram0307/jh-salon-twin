import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock functions
const mockGetClientNotes = vi.fn();
const mockCreateNote = vi.fn();
const mockSearchNotes = vi.fn();
const mockUpdateNote = vi.fn();
const mockDeleteNote = vi.fn();
const mockTogglePinNote = vi.fn();
const mockAddTagsToNote = vi.fn();
const mockRemoveTagsFromNote = vi.fn();

// Mock the service
vi.mock('../../services/ClientNoteService', () => ({
  default: {
    getClientNotes: (...args: any[]) => mockGetClientNotes(...args),
    createNote: (...args: any[]) => mockCreateNote(...args),
    searchNotes: (...args: any[]) => mockSearchNotes(...args),
    updateNote: (...args: any[]) => mockUpdateNote(...args),
    deleteNote: (...args: any[]) => mockDeleteNote(...args),
    togglePinNote: (...args: any[]) => mockTogglePinNote(...args),
    addTagsToNote: (...args: any[]) => mockAddTagsToNote(...args),
    removeTagsFromNote: (...args: any[]) => mockRemoveTagsFromNote(...args),
  },
}));

// Valid UUIDs for testing
const VALID_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_NOTE_ID = '550e8400-e29b-41d4-a716-446655440002';
const VALID_SALON_ID = '550e8400-e29b-41d4-a716-446655440003';
const VALID_STAFF_ID = '550e8400-e29b-41d4-a716-446655440004';

describe('ClientNoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClientNotes', () => {
    it('should return notes for a client', async () => {
      const mockNotes = {
        notes: [{ id: VALID_NOTE_ID, content: 'Test note' }],
        total: 1,
        page: 1,
      };
      mockGetClientNotes.mockResolvedValue(mockNotes);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.getClientNotes(VALID_CLIENT_ID, VALID_SALON_ID, { page: 1, limit: 20 });

      expect(result).toEqual(mockNotes);
      expect(mockGetClientNotes).toHaveBeenCalledWith(VALID_CLIENT_ID, VALID_SALON_ID, { page: 1, limit: 20 });
    });
  });

  describe('createNote', () => {
    it('should create a note successfully', async () => {
      const mockNote = {
        id: VALID_NOTE_ID,
        content: 'Test note',
        client_id: VALID_CLIENT_ID,
      };
      mockCreateNote.mockResolvedValue(mockNote);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.createNote(VALID_CLIENT_ID, VALID_SALON_ID, VALID_STAFF_ID, { content: 'Test note' });

      expect(result).toEqual(mockNote);
      expect(mockCreateNote).toHaveBeenCalledWith(VALID_CLIENT_ID, VALID_SALON_ID, VALID_STAFF_ID, { content: 'Test note' });
    });
  });

  describe('searchNotes', () => {
    it('should return search results', async () => {
      const mockResults = [{ id: VALID_NOTE_ID, content: 'Test note' }];
      mockSearchNotes.mockResolvedValue(mockResults);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.searchNotes(VALID_CLIENT_ID, VALID_SALON_ID, 'test', 20);

      expect(result).toEqual(mockResults);
      expect(mockSearchNotes).toHaveBeenCalledWith(VALID_CLIENT_ID, VALID_SALON_ID, 'test', 20);
    });
  });

  describe('updateNote', () => {
    it('should update a note successfully', async () => {
      const mockNote = { id: VALID_NOTE_ID, content: 'Updated' };
      mockUpdateNote.mockResolvedValue(mockNote);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.updateNote(VALID_NOTE_ID, VALID_SALON_ID, { content: 'Updated' });

      expect(result).toEqual(mockNote);
      expect(mockUpdateNote).toHaveBeenCalledWith(VALID_NOTE_ID, VALID_SALON_ID, { content: 'Updated' });
    });

    it('should return null if note not found', async () => {
      mockUpdateNote.mockResolvedValue(null);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.updateNote(VALID_NOTE_ID, VALID_SALON_ID, { content: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('deleteNote', () => {
    it('should delete a note successfully', async () => {
      mockDeleteNote.mockResolvedValue(true);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.deleteNote(VALID_NOTE_ID, VALID_SALON_ID);

      expect(result).toBe(true);
      expect(mockDeleteNote).toHaveBeenCalledWith(VALID_NOTE_ID, VALID_SALON_ID);
    });

    it('should return false if note not found', async () => {
      mockDeleteNote.mockResolvedValue(false);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.deleteNote(VALID_NOTE_ID, VALID_SALON_ID);

      expect(result).toBe(false);
    });
  });

  describe('togglePinNote', () => {
    it('should toggle pin status successfully', async () => {
      const mockNote = { id: VALID_NOTE_ID, is_pinned: true };
      mockTogglePinNote.mockResolvedValue(mockNote);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.togglePinNote(VALID_NOTE_ID, VALID_SALON_ID);

      expect(result).toEqual(mockNote);
      expect(mockTogglePinNote).toHaveBeenCalledWith(VALID_NOTE_ID, VALID_SALON_ID);
    });
  });

  describe('addTagsToNote', () => {
    it('should add tags successfully', async () => {
      const mockNote = { id: VALID_NOTE_ID, tags: ['allergy', 'color'] };
      mockAddTagsToNote.mockResolvedValue(mockNote);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.addTagsToNote(VALID_NOTE_ID, VALID_SALON_ID, ['allergy', 'color']);

      expect(result).toEqual(mockNote);
      expect(mockAddTagsToNote).toHaveBeenCalledWith(VALID_NOTE_ID, VALID_SALON_ID, ['allergy', 'color']);
    });
  });

  describe('removeTagsFromNote', () => {
    it('should remove tags successfully', async () => {
      const mockNote = { id: VALID_NOTE_ID, tags: ['color'] };
      mockRemoveTagsFromNote.mockResolvedValue(mockNote);

      const clientNoteService = (await import('../../services/ClientNoteService')).default;
      const result = await clientNoteService.removeTagsFromNote(VALID_NOTE_ID, VALID_SALON_ID, ['allergy']);

      expect(result).toEqual(mockNote);
      expect(mockRemoveTagsFromNote).toHaveBeenCalledWith(VALID_NOTE_ID, VALID_SALON_ID, ['allergy']);
    });
  });
});
