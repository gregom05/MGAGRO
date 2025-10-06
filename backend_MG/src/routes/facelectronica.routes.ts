import { Router } from 'express';
import { upsertFacElectronica, buscarFacElectronica } from '../controllers/facelectronica.controller';

const router = Router();

// Crear o actualizar FacElectronica
router.post('/', upsertFacElectronica);

// Buscar FacElectronica
router.get('/', buscarFacElectronica);

export default router;
