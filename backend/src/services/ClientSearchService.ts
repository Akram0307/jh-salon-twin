import clientSearchRepo from '../repositories/ClientSearchRepository'
import { ClientSearchResult, ClientSearchOptions } from '../repositories/ClientSearchRepository'

class ClientSearchService {

  async searchClients(options: ClientSearchOptions): Promise<ClientSearchResult[]> {
    const { salonId, searchTerm, limit = 20, offset = 0, searchType = 'fuzzy' } = options

    if (!salonId) {
      throw new Error('Salon ID is required')
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required')
    }

    // Sanitize search term
    const sanitizedTerm = searchTerm.trim()

    // Limit search term length for performance
    if (sanitizedTerm.length > 100) {
      throw new Error('Search term too long (max 100 characters)')
    }

    return clientSearchRepo.searchClients({
      salonId,
      searchTerm: sanitizedTerm,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      searchType
    })
  }

  async quickSearch(salonId: string, searchTerm: string, limit: number = 10): Promise<ClientSearchResult[]> {
    if (!salonId) {
      throw new Error('Salon ID is required')
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      return []
    }

    const sanitizedTerm = searchTerm.trim()

    return clientSearchRepo.searchClients({
      salonId,
      searchTerm: sanitizedTerm,
      limit: Math.min(limit, 20),
      searchType: 'quick'
    })
  }

  async findByPhone(phone: string, salonId: string): Promise<ClientSearchResult | null> {
    if (!salonId) {
      throw new Error('Salon ID is required')
    }

    if (!phone || phone.trim().length === 0) {
      throw new Error('Phone number is required')
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[0-9\s()-]{8,20}$/
    if (!phoneRegex.test(phone.trim())) {
      throw new Error('Invalid phone number format')
    }

    return clientSearchRepo.findByPhone(phone.trim(), salonId)
  }

  async getClientById(clientId: string, salonId: string): Promise<ClientSearchResult | null> {
    if (!salonId) {
      throw new Error('Salon ID is required')
    }

    if (!clientId) {
      throw new Error('Client ID is required')
    }

    return clientSearchRepo.getClientById(clientId, salonId)
  }

  async getSearchSuggestions(salonId: string, limit: number = 10): Promise<ClientSearchResult[]> {
    if (!salonId) {
      throw new Error('Salon ID is required')
    }

    return clientSearchRepo.getSearchSuggestions(salonId, Math.min(limit, 20))
  }

  async validateSearchAccess(salonId: string, userId: string, userRole: string): Promise<boolean> {
    // In a real implementation, this would check if the user has access to the salon
    // For now, we'll just return true
    return true
  }
}

export default new ClientSearchService()
