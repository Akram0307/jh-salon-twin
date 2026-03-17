
import logger from '../config/logger';
import { AutomaticRebookingEngine } from './AutomaticRebookingEngine'
import { query } from '../config/db'

export class AutoRebookNotifier {

  static async processSalon(salonId: string) {

    const reminders = await AutomaticRebookingEngine.scanClientsNeedingRebook(salonId)

    for (const reminder of reminders) {

      await this.dispatchReminder(reminder)

    }

    return reminders.length

  }

  static async dispatchReminder(reminder:any) {

    // fetch client contact info
    const client = await query(`
      SELECT phone, email, first_name
      FROM clients
      WHERE id = $1
    `,[reminder.clientId])

    if(!client.rows.length) return

    const c = client.rows[0]

    const message = `Hi ${c.first_name || ''}! Your next salon visit is coming up soon. Want to reserve a slot around ${new Date(reminder.suggestedDate).toDateString()}?`

    // Publish to messaging pipeline
    logger.info({
      clientId: reminder.clientId,
      salonId: reminder.salonId,
      phone: c.phone,
      message
    }, 'AUTO_REBOOK_REMINDER')

    // Future integration:
    // TwilioWhatsAppService.sendMessage(c.phone, message)

  }

}
