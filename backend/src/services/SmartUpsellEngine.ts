import { query } from '../config/db'

export class SmartUpsellEngine {

 static async recommendAddons(serviceId:string,salonId:string){

  const addons = await query(`
   SELECT id,name,price
   FROM services
   WHERE salon_id=$1
   AND category='addon'
   LIMIT 3
  `,[salonId])

  return addons.rows

 }

}
