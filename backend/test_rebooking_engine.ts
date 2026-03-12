import { AutomaticRebookingEngine } from './src/services/AutomaticRebookingEngine'

async function runTest(){

  const salonId = process.env.TEST_SALON_ID || 'demo-salon'
  const clientId = process.env.TEST_CLIENT_ID || 'demo-client'

  console.log('Testing Automatic Rebooking AI')

  const prediction = await AutomaticRebookingEngine.predictNextVisit(clientId, salonId)

  console.log('Prediction result:', prediction)

  const suggestion = await AutomaticRebookingEngine.generateRebookingSuggestion(clientId, salonId)

  console.log('Rebooking suggestion:', suggestion)

}

runTest().catch(console.error)
