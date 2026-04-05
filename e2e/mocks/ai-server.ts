/**
 * AI Backend Mock Server for E2E Tests
 * Lightweight Express server on port 3111 that mocks AI endpoints
 * used by the client chat interface and AI concierge features.
 */

import express from "express";
import { Request, Response } from "express";
import cors from "cors";

const PORT = parseInt(process.env.MOCK_AI_PORT || "3111", 10);

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Request logging to stderr
app.use((req: Request, _res: Response, next: import("express").NextFunction) => {
  const origEnd = _res.end;
  let statusCode = 200;
  (_res as unknown as { end: (...args: unknown[]) => void }).end = function (...args: unknown[]) {
    statusCode = _res.statusCode;
    process.stderr.write(`[MOCK-AI] ${req.method} ${req.originalUrl} -> ${statusCode}\n`);
    (origEnd as (...args: unknown[]) => void).apply(_res, args);
  };
  next();
});

// Health check
app.get("/api/ai/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "ai-mock" });
});

// POST /api/ai/chat - Generic AI chat endpoint
app.post("/api/ai/chat", (req: Request, res: Response) => {
  const message = (req.body.message || req.body.content || "").toLowerCase();
  let reply = "I'd be happy to help you with that!";

  if (message.includes("book") || message.includes("appointment")) {
    reply = "I'd be happy to help you book an appointment! What service are you looking for?";
  } else if (message.includes("price") || message.includes("cost")) {
    reply = "Our haircuts start at $25 and go up depending on the service. Would you like specific pricing?";
  } else if (message.includes("hour") || message.includes("open") || message.includes("close")) {
    reply = "We're open Monday through Saturday, 9 AM to 6 PM, and Sunday 10 AM to 4 PM.";
  } else if (message.includes("service")) {
    reply = "We offer haircuts, coloring, blowouts, manicures, pedicures, facials, massages, and more!";
  }

  res.json({
    success: true,
    data: {
      message: reply,
      intent: "GENERAL_INQUIRY",
      confidence: 0.95,
    },
  });
});

// POST /api/ai/suggestions - Service suggestions endpoint
app.post("/api/ai/suggestions", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      suggestions: [
        { id: "sug-001", type: "service", text: "Haircut - $35, 30 min", serviceId: "svc-001" },
        { id: "sug-002", type: "service", text: "Hair Coloring - $120, 120 min", serviceId: "svc-002" },
        { id: "sug-003", type: "service", text: "Blowout - $45, 45 min", serviceId: "svc-003" },
        { id: "sug-004", type: "service", text: "Manicure - $30, 30 min", serviceId: "svc-004" },
        { id: "sug-005", type: "service", text: "Facial - $85, 60 min", serviceId: "svc-006" },
        { id: "sug-006", type: "action", text: "Book an appointment" },
        { id: "sug-007", type: "action", text: "View all services" },
        { id: "sug-008", type: "action", text: "Check opening hours" },
      ],
    },
  });
});

// POST /api/ai/concierge/chat - AI Concierge chat (matches existing handler pattern)
app.post("/api/ai/concierge/chat", (req: Request, res: Response) => {
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
  } else if (message.includes("service")) {
    intent = "SERVICE_INQUIRY";
    reply = "We offer haircuts, coloring, blowouts, manicures, pedicures, facials, massages, and more! Would you like details on any specific service?";
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

// GET /api/ai/concierge/history - Chat history
app.get("/api/ai/concierge/history", (_req: Request, res: Response) => {
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

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found", service: "ai-mock" });
});

const server = app.listen(PORT, () => {
  process.stderr.write(`[MOCK-AI] AI mock server running on port ${PORT}\n`);
});

function shutdown(signal: string) {
  process.stderr.write(`[MOCK-AI] Received ${signal}, shutting down...\n`);
  server.close(() => {
    process.stderr.write("[MOCK-AI] Server closed\n");
    process.exit(0);
  });
  setTimeout(() => {
    process.stderr.write("[MOCK-AI] Forced shutdown after timeout\n");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
