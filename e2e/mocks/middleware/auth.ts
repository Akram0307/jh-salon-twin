import { Request, Response, NextFunction } from "express";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  user_type: string;
  salon_id: string;
}

const TEST_USER: MockUser = {
  id: "user-001",
  name: "Test Owner",
  email: "test@salon.com",
  phone: "+1-555-0001",
  role: "owner",
  user_type: "owner",
  salon_id: "b0dcbd9e-1ca0-450e-a299-7ad239f848f4",
};

export function mockAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        if (payload.id && payload.email) {
          (req as any).user = {
            ...TEST_USER,
            id: payload.id,
            name: payload.name || TEST_USER.name,
            email: payload.email,
            role: payload.role || TEST_USER.role,
            user_type: payload.user_type || TEST_USER.user_type,
          };
          return next();
        }
      }
    } catch {
      // fallback to test user
    }
  }
  (req as any).user = { ...TEST_USER };
  next();
}

export { TEST_USER };
