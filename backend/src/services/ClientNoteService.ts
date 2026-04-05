import clientNoteRepo from '../repositories/ClientNoteRepository'
import { ClientNoteInput } from '../repositories/ClientNoteRepository'

class ClientNoteService {

  async getNoteById(noteId: string, salonId: string) {
    return clientNoteRepo.getById(noteId, salonId)
  }

  async getClientNotes(
    clientId: string, 
    salonId: string, 
    options: { 
      page?: number, 
      limit?: number, 
      noteType?: string, 
      pinnedOnly?: boolean 
    } = {}
  ) {
    return clientNoteRepo.getByClient(clientId, salonId, options)
  }

  async createNote(clientId: string, salonId: string, staffId: string, payload: Partial<ClientNoteInput>) {
    const noteData: ClientNoteInput = {
      client_id: clientId,
      salon_id: salonId,
      staff_id: staffId,
      content: payload.content || '',
      note_type: payload.note_type,
      is_pinned: payload.is_pinned,
      tags: payload.tags,
      appointment_id: payload.appointment_id
    }
    
    // Validate content length
    if (noteData.content.length > 5000) {
      throw new Error('Note content exceeds maximum length of 5000 characters')
    }
    
    return clientNoteRepo.createNote(noteData)
  }

  async updateNote(noteId: string, salonId: string, payload: Partial<ClientNoteInput>) {
    // Validate content length if provided
    if (payload.content && payload.content.length > 5000) {
      throw new Error('Note content exceeds maximum length of 5000 characters')
    }
    
    return clientNoteRepo.updateNote(noteId, salonId, payload)
  }

  async deleteNote(noteId: string, salonId: string) {
    return clientNoteRepo.deleteNote(noteId, salonId)
  }

  async searchNotes(clientId: string, salonId: string, searchTerm: string, limit?: number) {
    // Sanitize search term for tsquery
    const sanitizedTerm = searchTerm.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    if (!sanitizedTerm) {
      return []
    }
    return clientNoteRepo.searchNotes(clientId, salonId, sanitizedTerm, { limit })
  }

  async getNotesByAppointment(appointmentId: string, salonId: string) {
    return clientNoteRepo.getNotesByAppointment(appointmentId, salonId)
  }

  async getRecentNotes(salonId: string, limit?: number) {
    return clientNoteRepo.getRecentNotes(salonId, limit)
  }

  async togglePinNote(noteId: string, salonId: string) {
    const note = await clientNoteRepo.getById(noteId, salonId)
    if (!note) {
      throw new Error('Note not found')
    }
    return clientNoteRepo.updateNote(noteId, salonId, { is_pinned: !note.is_pinned })
  }

  async addTagsToNote(noteId: string, salonId: string, tags: string[]) {
    const note = await clientNoteRepo.getById(noteId, salonId)
    if (!note) {
      throw new Error('Note not found')
    }
    const existingTags = note.tags || []
    const newTags = [...new Set([...existingTags, ...tags])]
    return clientNoteRepo.updateNote(noteId, salonId, { tags: newTags })
  }

  async removeTagsFromNote(noteId: string, salonId: string, tagsToRemove: string[]) {
    const note = await clientNoteRepo.getById(noteId, salonId)
    if (!note) {
      throw new Error('Note not found')
    }
    const existingTags = note.tags || []
    const newTags = existingTags.filter(tag => !tagsToRemove.includes(tag))
    return clientNoteRepo.updateNote(noteId, salonId, { tags: newTags })
  }
}

export default new ClientNoteService()
