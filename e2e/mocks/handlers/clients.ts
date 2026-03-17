import { Router, Request, Response } from "express";
import { clients } from "../data/clients";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(clients);
});

router.get("/:id", (req: Request, res: Response) => {
  const client = clients.find((c) => c.id === req.params.id);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }
  res.json(client);
});

router.post("/export", (_req: Request, res: Response) => {
  const header = "first_name,last_name,email,phone,created_at";
  const rows = clients.map(
    (c) => `${c.first_name},${c.last_name},${c.email},${c.phone},${c.created_at}`
  );
  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="clients_export.csv"'
  );
  res.send(csv);
});

export default router;
