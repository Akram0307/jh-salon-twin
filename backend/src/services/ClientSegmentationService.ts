import { query } from '../config/db'

export class ClientSegmentationService {

  async computeSegments(salonId:string){

    const clients = await query(`
      SELECT id,total_visits
      FROM clients
      WHERE salon_id=$1
    `,[salonId])

    for(const c of clients.rows){

      let segment='NEW'

      if(c.total_visits>10) segment='VIP'
      else if(c.total_visits>5) segment='LOYAL'
      else if(c.total_visits>1) segment='RETURNING'

      await query(`
        UPDATE clients
        SET segments=$1
        WHERE id=$2
      `,[segment,c.id])
    }
  }
}
