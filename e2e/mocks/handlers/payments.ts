import { Router, Request, Response } from "express";

const router = Router();

/** In-memory store for created payments */
const payments = new Map<string, Record<string, unknown>>();

/** POST /api/payments/charge – record a successful charge */
router.post("/charge", (req: Request, res: Response) => {
  const { amount, payment_method, appointment_id, client_id } = req.body;
  const id = `pay_${Date.now()}`;
  const payment = {
    id,
    amount: amount ?? 35.0,
    payment_method: payment_method ?? "cash",
    appointment_id: appointment_id ?? "apt-001",
    client_id: client_id ?? "client-001",
    status: "succeeded",
    created_at: new Date().toISOString(),
  };
  payments.set(id, payment);
  res.json({ success: true, data: payment, message: "Payment charged successfully" });
});

/** POST /api/payments/refund – process a successful refund */
router.post("/refund", (req: Request, res: Response) => {
  const { payment_id, amount } = req.body;
  const original = payments.get(payment_id);
  const refundId = `ref_${Date.now()}`;
  const refund = {
    id: refundId,
    payment_id,
    amount: amount ?? (original ? original.amount : 0),
    status: "refunded",
    created_at: new Date().toISOString(),
  };
  if (original) {
    original.status = "refunded";
    payments.set(payment_id, original);
  }
  res.json({ success: true, data: refund, message: "Payment refunded successfully" });
});

/** GET /api/payments/:id – return payment status */
router.get("/:id", (req: Request, res: Response) => {
  const paymentId = req.params.id as string;
  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, error: "Payment not found" });
  }
  res.json({ success: true, data: payment });
});

export default router;
