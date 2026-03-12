import { sendConfirmationSMS, sendReminderSMS } from './src/services/NotificationOrchestrator'

async function run() {
  const base = {
    appointmentId: 'test-appointment',
    salonId: 'test-salon',
    clientId: 'test-client',
    serviceName: 'Haircut',
    staffName: 'Any available stylist',
    dateTime: new Date().toISOString()
  }

  console.log('Running SMS verification in simulation-friendly mode')
  const confirmation = await sendConfirmationSMS(base as any)
  console.log('confirmation_result=', JSON.stringify(confirmation))
  const reminder = await sendReminderSMS(base as any)
  console.log('reminder_result=', JSON.stringify(reminder))
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
