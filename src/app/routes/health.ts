import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();

router.get('/health', HealthController.getHealth);
router.get('/api', HealthController.getApiInfo);

export default router;