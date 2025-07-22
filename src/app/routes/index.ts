import { Router } from 'express';
import healthRoutes from './health';

const router = Router();

// Mount route modules
router.use('/', healthRoutes);

export default router;