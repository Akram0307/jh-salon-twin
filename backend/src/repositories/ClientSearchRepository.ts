import db from '../config/db'

export interface ClientSearchResult {
  id: string
  full_name: string | null
  phone_number: string
  email: string | null
  salon_id: string
  similarity?: number
  rank?: number
}

export interface ClientSearchOptions {
  salonId: string
  searchTerm: string
  limit?: number
  offset?: number
  searchType?: 'fuzzy' | 'exact' | 'quick'
}

export class ClientSearchRepository {

  async searchClients(options: ClientSearchOptions): Promise<ClientSearchResult[]> {
    const { salonId, searchTerm, limit = 20, offset = 0, searchType = 'fuzzy' } = options

    if (searchType === 'quick') {
      return this.quickSearch(salonId, searchTerm, limit)
    }

    if (searchType === 'exact') {
      return this.exactSearch(salonId, searchTerm, limit, offset)
    }

    // Default: fuzzy search
    return this.fuzzySearch(salonId, searchTerm, limit, offset)
  }

  private async fuzzySearch(
    salonId: string, 
    searchTerm: string, 
    limit: number, 
    offset: number
  ): Promise<ClientSearchResult[]> {
    const result = await db.query(
      `SELECT 
         id, full_name, phone_number, email, salon_id,
         similarity(full_name, $1) as name_similarity,
         similarity(phone_number, $1) as phone_similarity,
         similarity(email, $1) as email_similarity,
         GREATEST(
           similarity(full_name, $1),
           similarity(phone_number, $1),
           COALESCE(similarity(email, $1), 0)
         ) as max_similarity
       FROM clients
       WHERE salon_id = $2
         AND (
           full_name % $1 OR
           phone_number % $1 OR
           email % $1
         )
       ORDER BY max_similarity DESC
       LIMIT $3 OFFSET $4`,
      [searchTerm, salonId, limit, offset]
    )

    return result.rows.map(row => ({
      id: row.id,
      full_name: row.full_name,
      phone_number: row.phone_number,
      email: row.email,
      salon_id: row.salon_id,
      similarity: parseFloat(row.max_similarity)
    }))
  }

  private async quickSearch(
    salonId: string, 
    searchTerm: string, 
    limit: number
  ): Promise<ClientSearchResult[]> {
    // For autocomplete - optimized for speed
    const result = await db.query(
      `SELECT 
         id, full_name, phone_number, email, salon_id
       FROM clients
       WHERE salon_id = $1
         AND (
           full_name ILIKE $2 || '%' OR
           phone_number ILIKE $2 || '%' OR
           email ILIKE $2 || '%'
         )
       ORDER BY 
         CASE WHEN full_name ILIKE $2 || '%' THEN 1
              WHEN phone_number ILIKE $2 || '%' THEN 2
              ELSE 3
         END,
         full_name
       LIMIT $3`,
      [salonId, searchTerm, limit]
    )

    return result.rows
  }

  private async exactSearch(
    salonId: string, 
    searchTerm: string, 
    limit: number, 
    offset: number
  ): Promise<ClientSearchResult[]> {
    const result = await db.query(
      `SELECT 
         id, full_name, phone_number, email, salon_id
       FROM clients
       WHERE salon_id = $1
         AND (
           full_name = $2 OR
           phone_number = $2 OR
           email = $2
         )
       ORDER BY full_name
       LIMIT $3 OFFSET $4`,
      [salonId, searchTerm, limit, offset]
    )

    return result.rows
  }

  async findByPhone(phone: string, salonId: string): Promise<ClientSearchResult | null> {
    const result = await db.query(
      `SELECT 
         id, full_name, phone_number, email, salon_id
       FROM clients
       WHERE salon_id = $1
         AND phone_number = $2
       LIMIT 1`,
      [salonId, phone]
    )

    return result.rows[0] || null
  }

  async getClientById(clientId: string, salonId: string): Promise<ClientSearchResult | null> {
    const result = await db.query(
      `SELECT 
         id, full_name, phone_number, email, salon_id
       FROM clients
       WHERE id = $1 AND salon_id = $2`,
      [clientId, salonId]
    )

    return result.rows[0] || null
  }

  async getSearchSuggestions(salonId: string, limit: number = 10): Promise<ClientSearchResult[]> {
    // Get recent or popular clients for suggestions
    const result = await db.query(
      `SELECT 
         id, full_name, phone_number, email, salon_id
       FROM clients
       WHERE salon_id = $1
       ORDER BY last_visit DESC NULLS LAST, created_at DESC
       LIMIT $2`,
      [salonId, limit]
    )

    return result.rows
  }
}

export default new ClientSearchRepository()
