import { Router } from 'express';
import { 
  crearActividad, 
  obtenerActividades, 
  obtenerActividadesPorEmpleado,
  obtenerActividadPorId, 
  actualizarActividad, 
  eliminarActividad,
  obtenerResumenHoras
} from '../controllers/actividades.controller';

const router = Router();

router.post('/', crearActividad);
router.get('/', obtenerActividades);
router.get('/resumen', obtenerResumenHoras);
router.get('/empleado/:empleado_id', obtenerActividadesPorEmpleado);
router.get('/:id', obtenerActividadPorId);
router.put('/:id', actualizarActividad);
router.delete('/:id', eliminarActividad);

export default router;
