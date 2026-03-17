import { Router } from 'express';
import { auditLogger } from '../middleware/auditLogger';
import ownerSetupRoutes from './ownerSetupRoutes';
import ownerHealthRoutes from './ownerHealthRoutes';
import ownerScheduleRoutes from './ownerScheduleRoutes';
import ownerScheduleRulesRoutes from './ownerScheduleRulesRoutes';
import ownerScheduleRuleDetailRoutes from './ownerScheduleRuleDetailRoutes';
import ownerSettingsRoutes from './ownerSettingsRoutes';
import ownerDashboardRoutes from './ownerDashboardRoutes';
import ownerReportRoutes from './ownerReportRoutes';

const router = Router();

router.use(auditLogger);
router.use(ownerSetupRoutes);
router.use(ownerHealthRoutes);
router.use(ownerScheduleRoutes);
router.use(ownerScheduleRulesRoutes);
router.use(ownerScheduleRuleDetailRoutes);
router.use(ownerSettingsRoutes);
router.use(ownerDashboardRoutes);
router.use(ownerReportRoutes);

export default router;
