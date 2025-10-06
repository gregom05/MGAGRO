import { Router } from 'express';
import { 
  crearEmpleado, 
  obtenerEmpleados, 
  obtenerEmpleadoPorId, 
  actualizarEmpleado, 
  eliminarEmpleado,
  buscarEmpleados
} from '../controllers/empleados.controller';

const router = Router();

router.post('/', crearEmpleado);
router.get('/', obtenerEmpleados);
router.get('/buscar', buscarEmpleados);
router.get('/:id', obtenerEmpleadoPorId);
router.put('/:id', actualizarEmpleado);
router.delete('/:id', eliminarEmpleado);

export default router;
