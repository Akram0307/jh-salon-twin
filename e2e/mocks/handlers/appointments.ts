import { Router, Request, Response } from "express";
import { appointments, Appointment } from "../data/appointments";
import { services } from "../data/services";

const router = Router();

let appts = [...appointments];

router.get("/", (_req: Request, res: Response) => {
  res.json(appts);
});

router.post("/", (req: Request, res: Response) => {
  const body = req.body;
  const svcIds: string[] = body.services || [];
  const svcObjects = svcIds
    .map((id: string) => {
      const s = services.find((sv) => sv.id === id);
      return s ? { id: s.id, name: s.name, price: s.price, duration: s.duration } : null;
    })
    .filter(Boolean);

  const newAppt: Appointment = {
    id: `appt-${Date.now()}`,
    client_id: body.client_id || "client-001",
    client_name: body.client_name || "New Client",
    staff_id: body.staff_id || "staff-001",
    staff_name: body.staff_name || "Maria Gonzalez",
    appointment_time: body.appointment_time || "2026-03-18T12:00:00",
    end_time: body.end_time || "2026-03-18T12:30:00",
    status: body.status || "pending",
    services: svcObjects.filter((s: any) => s !== null) as any[],
    notes: body.notes,
    created_at: new Date().toISOString(),
  };
  appts.push(newAppt);
  res.status(201).json(newAppt);
});

router.patch("/:id/status", (req: Request, res: Response) => {
  const idx = appts.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }
  appts[idx] = { ...appts[idx], status: req.body.status || appts[idx].status };
  res.json(appts[idx]);
});

router.delete("/:id", (req: Request, res: Response) => {
  const idx = appts.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }
  appts.splice(idx, 1);
  res.json({ success: true });
});

router.get("/:id/services", (req: Request, res: Response) => {
  const appt = appts.find((a) => a.id === req.params.id);
  if (!appt) {
    return res.status(404).json([]);
  }
  res.json(appt.services);
});

router.post("/:id/services", (req: Request, res: Response) => {
  const appt = appts.find((a) => a.id === req.params.id);
  if (!appt) {
    return res.status(404).json({ error: "Appointment not found" });
  }
  const svcId = req.body.service_id;
  const svc = services.find((s) => s.id === svcId);
  if (!svc) {
    return res.status(400).json({ error: "Service not found" });
  }
  const svcObj = { id: svc.id, name: svc.name, price: svc.price, duration: svc.duration };
  appt.services.push(svcObj);
  res.status(201).json(svcObj);
});

export default router;
