import beautyProfileRepo from '../repositories/ClientBeautyProfileRepository'
import type { BeautyProfilePayload } from '../types/serviceTypes';

class ClientBeautyProfileService {

  async getClientProfile(clientId: string, salonId: string) {
    return beautyProfileRepo.getByClient(clientId, salonId)
  }

  async createProfile(clientId: string, salonId: string, payload: BeautyProfilePayload) {
    return beautyProfileRepo.createProfile({
      client_id: clientId,
      salon_id: salonId,
      ...payload
    })
  }

  async updateProfile(clientId: string, salonId: string, payload: BeautyProfilePayload) {
    return beautyProfileRepo.updateProfile(clientId, salonId, payload)
  }

  async upsertProfile(clientId: string, salonId: string, payload: BeautyProfilePayload) {
    return beautyProfileRepo.upsertProfile({
      client_id: clientId,
      salon_id: salonId,
      ...payload
    })
  }

  async updateLastVisitFromBooking(clientId: string, salonId: string, visitDate: Date) {
    return beautyProfileRepo.updateProfile(clientId, salonId, {
      last_visit: visitDate
    })
  }

  async getClientProfileForAI(clientId: string, salonId: string) {
    const profile = await beautyProfileRepo.getByClient(clientId, salonId)

    if (!profile) return null

    return {
      hair_profile: profile.hair_profile,
      skin_profile: profile.skin_profile,
      allergies: profile.allergies,
      stylist_preferences: profile.stylist_preferences,
      color_formula_history: profile.color_formula_history,
      last_visit: profile.last_visit
    }
  }

}

export default new ClientBeautyProfileService()
