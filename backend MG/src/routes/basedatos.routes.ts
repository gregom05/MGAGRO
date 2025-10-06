import { Router } from 'express';
import { crearBaseDatos, buscarBasesDatos, eliminarBaseDatos, actualizarBaseDatos } from '../controllers/basedatos.controller';

const router = Router();

router.post('/', crearBaseDatos);
router.get('/', buscarBasesDatos);
router.delete('/:id', eliminarBaseDatos);
router.put('/:id', actualizarBaseDatos);

export default router;
