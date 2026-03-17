import { Router, Request, Response } from "express";
import { staff } from "../data/staff";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: staff,
  });
});

router.get("/:id/availability", (req: Request, res: Response) => {
  const member = staff.find((s) => s.id === req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, error: "Staff not found" });
  }
  const date = req.query.date as string || "2026-03-18";
  const slots = [];
  for (let h = 9; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 17 && m > 0) break;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const isBooked = (h === 10 && m === 0) || (h === 10 && m === 30) || (h === 16 && m === 0);
      slots.push({
        time: `${date}T${time}:00`,
        available: !isBooked,
      });
    }
  }
  res.json({
    success: true,
    data: slots,
  });
});

export default router;
