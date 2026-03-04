import { Router } from 'express';
import { 
  crearMovimiento, 
  obtenerMovimientos, 
  obtenerMovimientosPorArticulo,
  obtenerResumenMovimientos,
  eliminarMovimiento
} from '../controllers/movimientos.controller';
import { verificarToken, soloAdmin, adminOEmpleado, adminEmpleadoOGeneral } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
// admin, empleado y general pueden crear; solo admin puede eliminar
router.post('/', verificarToken, adminEmpleadoOGeneral, crearMovimiento);
router.get('/', verificarToken, adminEmpleadoOGeneral, obtenerMovimientos);
router.get('/resumen', verificarToken, soloAdmin, obtenerResumenMovimientos);
router.get('/articulo/:articulo_id', verificarToken, adminEmpleadoOGeneral, obtenerMovimientosPorArticulo);
router.delete('/:id', verificarToken, soloAdmin, eliminarMovimiento); // Solo admin puede eliminar

export default router;
