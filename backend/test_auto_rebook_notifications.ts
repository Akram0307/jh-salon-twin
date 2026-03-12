import { AutoRebookNotifier } from './src/services/AutoRebookNotifier'

async function run(){

  const salonId = process.env.TEST_SALON_ID || 'demo-salon'

  console.log('Testing Auto Rebook Notifications...')

  const result = await AutoRebookNotifier.processSalon(salonId)

  console.log('Notifications generated:', result)

}

run().catch(console.error)
