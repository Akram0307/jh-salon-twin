import { Router, Request, Response } from "express";

const router = Router();

router.post("/create-draft", (req: Request, res: Response) => {
  const items = req.body.items || [
    { service_id: "svc-001", name: "Haircut", price: 35, quantity: 1 },
  ];
  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * (i.quantity || 1), 0);
  res.json({
    id: `draft_${Date.now()}`,
    items,
    subtotal,
    tip: 0,
    total: subtotal,
    status: "draft",
    created_at: new Date().toISOString(),
  });
});

router.post("/complete-transaction", (req: Request, res: Response) => {
  const items = req.body.items || [
    { service_id: "svc-001", name: "Haircut", price: 35, quantity: 1 },
  ];
  const tip = req.body.tip || 0;
  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * (i.quantity || 1), 0);
  res.json({
    id: `tx_${Date.now()}`,
    items,
    subtotal,
    tip,
    total: subtotal + tip,
    payment_method: req.body.payment_method || "cash",
    client_id: req.body.client_id || "client-001",
    staff_id: req.body.staff_id || "staff-001",
    status: "paid",
    created_at: new Date().toISOString(),
  });
});

router.get("/z-report", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      total_transactions: 8,
      total_revenue: 1245.50,
      payment_breakdown: {
        cash: 520.00,
        card: 625.50,
        other: 100.00,
      },
      period_start: "2026-03-18T00:00:00Z",
      period_end: "2026-03-18T23:59:59Z",
    },
  });
});

export default router;
