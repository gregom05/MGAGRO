import { Router } from 'express';
import { upsertTipoCambio, buscarTipoCambio } from '../controllers/tipocambio.controller';

const router = Router();

// Crear o actualizar TipoCambio
router.post('/', upsertTipoCambio);

// Buscar TipoCambio
router.get('/', buscarTipoCambio);

export default router;
