import { pool } from './src/config/db'
import { AppointmentRepository } from './src/repositories/AppointmentRepository'
import { TransactionRepository } from './src/repositories/TransactionRepository'

async function run(){
  console.log('Enterprise 50k simulation starting...')

  const services = (await pool.query("SELECT id, salon_id, price AS base_price FROM services LIMIT 5")).rows
  const staff = (await pool.query("SELECT id FROM staff LIMIT 5")).rows
  const clients = (await pool.query("SELECT id FROM clients LIMIT 200")).rows

  const TOTAL = 50000
  const BATCH = 200

  let success = 0
  let failed = 0

  for(let i=0;i<TOTAL;i+=BATCH){
    const tasks:any[] = []

    for(let j=0;j<BATCH;j++){
      const staffId = staff[Math.floor(Math.random()*staff.length)].id
      const clientId = clients[Math.floor(Math.random()*clients.length)].id
      const service = services[Math.floor(Math.random()*services.length)]

      const slot = new Date()
      slot.setMinutes(slot.getMinutes()+Math.floor(Math.random()*10000))

      tasks.push(
        AppointmentRepository.create({
          salon_id: service.salon_id,
          client_id: clientId,
          staff_id: staffId,
          appointment_time: slot.toISOString(),
          services:[{service_id:service.id,base_price:service.base_price||0}]
        })
        .then(async ()=>{
          success++

          if(Math.random() < 0.4){
            await TransactionRepository.createTransaction({
              salon_id: service.salon_id,
              client_id: clientId,
              staff_id: staffId,
              payment_method:'card',
              subtotal: service.base_price || 0,
              tax:0,
              tip:0,
              total: service.base_price || 0
            })
          }
        })
        .catch(()=>{failed++})
      )
    }

    await Promise.all(tasks)

    if((i+BATCH)%5000===0){
      console.log('progress',i+BATCH)
    }
  }

  console.log('\n=== ENTERPRISE TEST RESULTS ===')
  console.log('attempts',TOTAL)
  console.log('success',success)
  console.log('failed',failed)

  await pool.end()
}

run().catch(console.error)
