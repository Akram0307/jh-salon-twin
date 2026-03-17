import { Router, Request, Response } from "express";
import { TEST_USER } from "../middleware/auth";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  res.json({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMDAxIiwibmFtZSI6IlRlc3QgT3duZXIiLCJlbWFpbCI6InRlc3RAc2Fsb24uY29tIiwicm9sZSI6Im93bmVyIiwidXNlcl90eXBlIjoib3duZXIiLCJzYWxvbl9pZCI6ImIwZGNiZDllLTFjYTAtNDUwZS1hMjk5LTdhZDIzOWY4NDhmNCIsImlhdCI6MTc0MjI2NTYwMCwiZXhwIjoxNzQyMzUyMDAwfQ.mock",
    refresh_token: "rt_mock_refresh_token_2026",
    user: {
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      role: TEST_USER.role,
      user_type: TEST_USER.user_type,
    },
  });
});

router.post("/refresh", (_req: Request, res: Response) => {
  res.json({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMDAxIiwibmFtZSI6IlRlc3QgT3duZXIiLCJlbWFpbCI6InRlc3RAc2Fsb24uY29tIiwicm9sZSI6Im93bmVyIiwidXNlcl90eXBlIjoib3duZXIiLCJzYWxvbl9pZCI6ImIwZGNiZDllLTFjYTAtNDUwZS1hMjk5LTdhZDIzOWY4NDhmNCIsImlhdCI6MTc0MjI2NTYwMCwiZXhwIjoxNzQyMzUyMDAwfQ.mock-refreshed",
  });
});

router.post("/forgot-password", (_req: Request, res: Response) => {
  res.json({ message: "If an account exists, a reset link has been sent" });
});

router.post("/reset-password", (_req: Request, res: Response) => {
  res.json({ message: "Password reset successfully" });
});

router.get("/me", (_req: Request, res: Response) => {
  res.json({
    id: TEST_USER.id,
    name: TEST_USER.name,
    email: TEST_USER.email,
    phone: TEST_USER.phone,
    role: TEST_USER.role,
    user_type: TEST_USER.user_type,
  });
});

export default router;
