import db from '../config/db'

export interface ClientBeautyProfileInput {
  client_id: string
  salon_id: string
  hair_profile?: any
  skin_profile?: any
  allergies?: string[]
  stylist_preferences?: any
  notes?: string
  color_formula_history?: any[]
  photo_references?: any[]
  last_visit?: Date
}

export class ClientBeautyProfileRepository {

  async getByClient(clientId: string, salonId: string) {
    const result = await db.query(
      `SELECT * FROM client_beauty_profiles
       WHERE client_id = $1 AND salon_id = $2`,
      [clientId, salonId]
    )

    return result.rows[0]
  }

  async createProfile(data: ClientBeautyProfileInput) {
    const result = await db.query(
      `INSERT INTO client_beauty_profiles
      (client_id, salon_id, hair_profile, skin_profile, allergies,
       stylist_preferences, notes, color_formula_history, photo_references, last_visit)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        data.client_id,
        data.salon_id,
        data.hair_profile || {},
        data.skin_profile || {},
        data.allergies || [],
        data.stylist_preferences || {},
        data.notes || null,
        data.color_formula_history || [],
        data.photo_references || [],
        data.last_visit || null
      ]
    )

    return result.rows[0]
  }

  async updateProfile(clientId: string, salonId: string, payload: Partial<ClientBeautyProfileInput>) {
    const result = await db.query(
      `UPDATE client_beauty_profiles
       SET hair_profile = COALESCE($3, hair_profile),
           skin_profile = COALESCE($4, skin_profile),
           allergies = COALESCE($5, allergies),
           stylist_preferences = COALESCE($6, stylist_preferences),
           notes = COALESCE($7, notes),
           color_formula_history = COALESCE($8, color_formula_history),
           photo_references = COALESCE($9, photo_references),
           last_visit = COALESCE($10, last_visit),
           updated_at = NOW()
       WHERE client_id = $1 AND salon_id = $2
       RETURNING *`,
      [
        clientId,
        salonId,
        payload.hair_profile,
        payload.skin_profile,
        payload.allergies,
        payload.stylist_preferences,
        payload.notes,
        payload.color_formula_history,
        payload.photo_references,
        payload.last_visit
      ]
    )

    return result.rows[0]
  }

  async upsertProfile(data: ClientBeautyProfileInput) {
    const existing = await this.getByClient(data.client_id, data.salon_id)

    if (!existing) {
      return this.createProfile(data)
    }

    return this.updateProfile(data.client_id, data.salon_id, data)
  }

}

export default new ClientBeautyProfileRepository()
