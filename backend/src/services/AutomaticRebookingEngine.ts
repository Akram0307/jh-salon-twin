import { query } from '../config/db'
import ClientBeautyProfileRepository from '../repositories/ClientBeautyProfileRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import type { ServiceHistoryEntry } from '../types/serviceTypes';

export class AutomaticRebookingEngine {

  static async predictNextVisit(clientId: string, salonId: string) {

    const profile = await ClientBeautyProfileRepository.getByClient(clientId, salonId)

    const history = await AppointmentRepository.getClientServiceHistory(clientId, salonId)

    const interval = await this.calculateServiceInterval(history)

    if (!profile?.last_visit) return null

    const lastVisit = new Date(profile.last_visit)

    const nextVisit = new Date(lastVisit)
    nextVisit.setDate(nextVisit.getDate() + interval)

    return {
      clientId,
      salonId,
      lastVisit,
      predictedIntervalDays: interval,
      nextVisitDate: nextVisit
    }
  }

  static async calculateServiceInterval(serviceHistory: ServiceHistoryEntry[]) {

    if (!serviceHistory || serviceHistory.length < 2) return 28

    const intervals:number[] = []

    for (let i = 1; i < serviceHistory.length; i++) {
      const prev = new Date(serviceHistory[i-1].appointment_date)
      const current = new Date(serviceHistory[i].appointment_date)

      const diff = (current.getTime() - prev.getTime()) / (1000*60*60*24)
      intervals.push(diff)
    }

    const avg = intervals.reduce((a,b)=>a+b,0)/intervals.length

    return Math.round(avg)
  }

  static async generateRebookingSuggestion(clientId: string, salonId: string) {

    const prediction = await this.predictNextVisit(clientId, salonId)

    if (!prediction) return null

    return {
      clientId,
      salonId,
      suggestedDate: prediction.nextVisitDate,
      daysUntilVisit: Math.ceil(
        (prediction.nextVisitDate.getTime() - Date.now()) / (1000*60*60*24)
      ),
      type: 'REBOOK_REMINDER'
    }
  }

  static async scanClientsNeedingRebook(salonId: string) {

    const clients = await query(`
      SELECT client_id
      FROM client_beauty_profiles
      WHERE salon_id = $1
      AND last_visit IS NOT NULL
    `,[salonId])

    const reminders:any[] = []

    for(const row of clients.rows){

      const suggestion = await this.generateRebookingSuggestion(row.client_id, salonId)

      if(!suggestion) continue

      if(suggestion.daysUntilVisit <= 7 && suggestion.daysUntilVisit >= 0){
        reminders.push(suggestion)
      }

    }

    return reminders

  }

}
