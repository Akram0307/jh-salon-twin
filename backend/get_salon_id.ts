import { pool } from './src/config/db'

async function run(){
 const r = await pool.query('select id from salons limit 1')
 console.log(r.rows[0].id)
 await pool.end()
}
run()
