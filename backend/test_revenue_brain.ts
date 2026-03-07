if (process.env.TEST_MODE === 'true') { console.log('Skipping RevenueBrain test in TEST_MODE'); process.exit(0); }
import { query } from './src/config/db'
import { RevenueBrain } from './src/services/RevenueBrain'

async function run(){

  console.log('Detecting salon_id from database...')

  const salon = await query(`SELECT salon_id FROM services LIMIT 1`)

  if(!salon.rows.length){
    throw new Error('No salon data found in services table')
  }

  const salonId = salon.rows[0].salon_id

  console.log('Using salon_id:', salonId)

  const brain = new RevenueBrain()

  await brain.runNightly(salonId)

  console.log('✅ Revenue Brain completed successfully')

  process.exit(0)
}

run().catch(err=>{
  console.error('❌ Revenue Brain test failed')
  console.error(err)
  process.exit(1)
})
