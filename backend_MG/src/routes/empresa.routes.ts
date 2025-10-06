import { Router } from 'express';
import { crearEmpresa, eliminarEmpresa, buscarEmpresas, actualizarEmpresa } from '../controllers/emopresa.controller';

const router = Router();


router.post('/', crearEmpresa);
router.get('/', buscarEmpresas);
router.delete('/:id', eliminarEmpresa);
router.put('/actualizar', actualizarEmpresa);

export default router;