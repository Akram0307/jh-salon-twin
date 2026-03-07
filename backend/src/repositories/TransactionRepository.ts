import { query } from '../config/db';

export class TransactionRepository {

  static async sumRecoveredRevenue() {
    const result = await query(`
      SELECT COALESCE(SUM(total_amount),0) as total
      FROM transactions
      WHERE source = 'waitlist_recovery'
    `);

    return parseFloat(result.rows[0].total);
  }

  static async createTransaction(data:any) {
    const { salon_id, staff_id, client_id, payment_method, items } = data;

    const total = items.reduce((sum:any,i:any)=> sum + (i.price * (i.quantity || 1)),0);

    const tx = await query(
      `INSERT INTO transactions(salon_id,staff_id,client_id,total_amount,payment_method)
       VALUES($1,$2,$3,$4,$5)
       RETURNING *`,
      [salon_id, staff_id, client_id, total, payment_method]
    );

    const transaction = tx.rows[0];

    for (const item of items) {
      await query(
        `INSERT INTO transaction_items(transaction_id,item_type,item_id,name,quantity,price)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [
          transaction.id,
          item.item_type,
          item.item_id || null,
          item.name,
          item.quantity || 1,
          item.price
        ]
      );
    }

    return transaction;
  }

  static async getRecent(limit:number=20) {
    const result = await query(
      `SELECT * FROM transactions
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}
