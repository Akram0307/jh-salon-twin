import { Router, Request, Response } from "express";

const router = Router();

const SALON_ID = "b0dcbd9e-1ca0-450e-a299-7ad239f848f4";

function envelope(data: any, message: string) {
  return {
    success: true,
    data,
    message,
    error: null,
    meta: { salon_id: SALON_ID },
  };
}

router.get("/stats", (_req: Request, res: Response) => {
  res.json(
    envelope(
      {
        today_appointments: 8,
        total_clients: 156,
        total_staff: 5,
        today_revenue: 1245.50,
      },
      "Dashboard stats loaded successfully"
    )
  );
});

router.get("/recent-activity", (_req: Request, res: Response) => {
  res.json(
    envelope(
      [
        {
          id: "act-001",
          type: "appointment_created",
          description: "New appointment booked for Sarah Johnson",
          timestamp: "2026-03-18T09:15:00Z",
          user_id: "user-001",
        },
        {
          id: "act-002",
          type: "payment_completed",
          description: "Payment of $85.00 received from Michael Chen",
          timestamp: "2026-03-18T09:20:00Z",
          user_id: "user-001",
        },
        {
          id: "act-003",
          type: "client_created",
          description: "New client Rachel Harris added",
          timestamp: "2026-03-18T10:00:00Z",
          user_id: "user-001",
        },
        {
          id: "act-004",
          type: "appointment_cancelled",
          description: "Appointment for Kevin Clark cancelled",
          timestamp: "2026-03-18T10:30:00Z",
          user_id: "user-001",
        },
        {
          id: "act-005",
          type: "staff_updated",
          description: "Maria Gonzalez availability updated",
          timestamp: "2026-03-18T11:00:00Z",
          user_id: "user-001",
        },
      ],
      "Recent activity loaded successfully"
    )
  );
});

export default router;
