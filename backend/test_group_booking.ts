import { GroupBookingService } from './src/services/GroupBookingService'
import { ClientRepository } from './src/repositories/ClientRepository'
import { pool } from './src/config/db'

async function run(){

  const salonId = process.env.SALON_ID as string

  if(!salonId){
    throw new Error('SALON_ID env variable required for tests')
  }

  // create two test clients
  const client1 = await ClientRepository.create({
    phone_number: '+19990000001',
    full_name: 'Group Test Client 1'
  })

  const client2 = await ClientRepository.create({
    phone_number: '+19990000002',
    full_name: 'Group Test Client 2'
  })

  // fetch a valid service
  const serviceRes = await pool.query('SELECT id, base_price FROM services LIMIT 1')

  if(serviceRes.rows.length === 0){
    throw new Error('No services found in DB for test')
  }

  const service = serviceRes.rows[0]

  const result = await GroupBookingService.createGroupBooking({

    salon_id: salonId,

    client_ids:[
      client1.id,
      client2.id
    ],

    appointment_time:new Date().toISOString(),

    services:[{
      service_id: service.id,
      base_price: service.base_price
    }]

  })

  console.log('✅ Group booking result:')
  console.log(result)

  await pool.end()

}

run().catch(console.error)
