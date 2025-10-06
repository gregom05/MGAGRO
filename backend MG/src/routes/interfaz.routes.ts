import { Router } from 'express';
import { upsertInterfaz, buscarInterfaz } from '../controllers/interfaz.controller';

const router = Router();

router.post('/', upsertInterfaz);
router.get('/', buscarInterfaz);

export default router;
