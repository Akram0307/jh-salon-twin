import { Router, Request, Response } from "express";

const router = Router();

router.post("/concierge/chat", (req: Request, res: Response) => {
  const message = (req.body.message || "").toLowerCase();
  let intent = "GENERAL_INQUIRY";
  let reply = "I'd be happy to help you with that!";

  if (message.includes("book") || message.includes("appointment")) {
    intent = "BOOK_SERVICE";
    reply = "I'd be happy to help you book an appointment! What service are you looking for?";
  } else if (message.includes("price") || message.includes("cost")) {
    intent = "PRICE_INQUIRY";
    reply = "Our haircuts start at $25 and go up depending on the service. Would you like me to give you specific pricing?";
  } else if (message.includes("hour") || message.includes("open") || message.includes("close")) {
    intent = "HOURS_INQUIRY";
    reply = "We're open Monday through Saturday, 9 AM to 6 PM, and Sunday 10 AM to 4 PM.";
  }

  res.json({
    success: true,
    data: {
      intent,
      confidence: 0.95,
      missingFields: [],
      bookingIntent: intent === "BOOK_SERVICE"
        ? {
            service: null,
            preferred_date: null,
            preferred_time: null,
            staff_preference: null,
          }
        : null,
      message: reply,
    },
  });
});

router.get("/concierge/history", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: "msg-001",
        role: "user",
        content: "I want to book a haircut",
        timestamp: "2026-03-18T10:00:00Z",
      },
      {
        id: "msg-002",
        role: "assistant",
        content: "I'd be happy to help you book an appointment! What service are you looking for?",
        timestamp: "2026-03-18T10:00:01Z",
      },
      {
        id: "msg-003",
        role: "user",
        content: "A haircut for tomorrow at 2pm",
        timestamp: "2026-03-18T10:00:05Z",
      },
      {
        id: "msg-004",
        role: "assistant",
        content: "Great! I can help you book a haircut for tomorrow at 2 PM. Do you have a preferred stylist?",
        timestamp: "2026-03-18T10:00:06Z",
      },
    ],
  });
});

export default router;
