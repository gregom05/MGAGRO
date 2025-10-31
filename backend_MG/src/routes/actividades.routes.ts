import { Router } from 'express';
import { 
  crearActividad, 
  obtenerActividades, 
  obtenerActividadesPorEmpleado,
  obtenerActividadPorId, 
  actualizarActividad, 
  eliminarActividad,
  obtenerResumenHectareas
} from '../controllers/actividades.controller';

const router = Router();

router.post('/', crearActividad);
router.get('/', obtenerActividades);
router.get('/resumen', obtenerResumenHectareas);
router.get('/empleado/:empleado_id', obtenerActividadesPorEmpleado);
router.get('/:id', obtenerActividadPorId);
router.put('/:id', actualizarActividad);
router.delete('/:id', eliminarActividad);

export default router;
