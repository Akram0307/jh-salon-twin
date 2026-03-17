import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import authHandler from "./handlers/auth";
import appointmentsHandler from "./handlers/appointments";
import clientsHandler from "./handlers/clients";
import servicesHandler from "./handlers/services";
import staffHandler from "./handlers/staff";
import posHandler from "./handlers/pos";
import paymentsHandler from "./handlers/payments";
import aiHandler from "./handlers/ai";
import dashboardHandler from "./handlers/dashboard";
import { mockAuth } from "./middleware/auth";

const PORT = parseInt(process.env.MOCK_API_PORT || "4000", 10);
const SALON_ID = "b0dcbd9e-1ca0-450e-a299-7ad239f848f4";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Request logging to stderr
app.use((req: Request, _res: Response, next: import("express").NextFunction) => {
  // We log after response to capture status code
  const origEnd = _res.end;
  let statusCode = 200;
  (_res as any).end = function (...args: any[]) {
    statusCode = _res.statusCode;
    process.stderr.write(`[MOCK] ${req.method} ${req.originalUrl} -> ${statusCode}
`);
    (origEnd as Function).apply(_res, args);
  };
  next();
});

// Health (no auth)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Auth routes (no mock auth middleware - these handle their own auth)
app.use("/api/auth", authHandler);

// All other routes use mock auth
app.use(mockAuth);

// Dashboard
app.use("/api/dashboard", dashboardHandler);

// Alerts
app.get("/api/alerts", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: "alert-001",
        type: "overlap_warning",
        title: "Scheduling Conflict",
        message: "Maria Gonzalez has overlapping appointments at 10:00-11:00 and 10:30-11:30",
        severity: "warning",
        read: false,
        created_at: "2026-03-18T08:00:00Z",
      },
      {
        id: "alert-002",
        type: "low_inventory",
        title: "Low Inventory",
        message: "Hair coloring supplies running low - 3 units remaining",
        severity: "info",
        read: true,
        created_at: "2026-03-17T14:00:00Z",
      },
      {
        id: "alert-003",
        type: "no_show",
        title: "No-Show Detected",
        message: "Robert Taylor missed their 12:00 PM appointment",
        severity: "warning",
        read: false,
        created_at: "2026-03-18T12:35:00Z",
      },
    ],
    message: "Alerts loaded successfully",
    error: null,
    meta: { salon_id: SALON_ID },
  });
});

// Notifications
app.get("/api/notifications", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: "notif-001",
        type: "appointment_reminder",
        title: "Upcoming Appointment",
        message: "You have an appointment with Sarah Johnson at 9:00 AM",
        read: false,
        created_at: "2026-03-18T07:00:00Z",
      },
      {
        id: "notif-002",
        type: "payment_received",
        title: "Payment Received",
        message: "$85.00 payment received from Michael Chen",
        read: true,
        created_at: "2026-03-18T09:20:00Z",
      },
      {
        id: "notif-003",
        type: "new_client",
        title: "New Client Registered",
        message: "Rachel Harris has been added as a new client",
        read: true,
        created_at: "2026-03-18T10:00:00Z",
      },
    ],
  });
});

// Appointments
app.use("/api/appointments", appointmentsHandler);

// Clients
app.use("/api/clients", clientsHandler);

// Services
app.use("/api/services", servicesHandler);

// Staff
app.use("/api/staff", staffHandler);

// Payments
app.use("/api/payments", paymentsHandler);

// POS
app.use("/api/pos", posHandler);

// AI Concierge
app.use("/api/ai", aiHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(PORT, () => {
  process.stderr.write(`[MOCK] Mock API server running on port ${PORT}\n`);
});

function shutdown(signal: string) {
  process.stderr.write(`[MOCK] Received ${signal}, shutting down...\n`);
  server.close(() => {
    process.stderr.write("[MOCK] Server closed\n");
    process.exit(0);
  });
  setTimeout(() => {
    process.stderr.write("[MOCK] Forced shutdown after timeout\n");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
