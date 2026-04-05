import { Router, Request, Response } from "express";
import { services, serviceCategories } from "../data/services";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: services,
    meta: undefined,
    error: undefined,
  });
});

router.get("/categories", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: serviceCategories,
  });
});

export default router;
