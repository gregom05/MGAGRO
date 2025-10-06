import { Router } from 'express';
import { 
  crearMovimiento, 
  obtenerMovimientos, 
  obtenerMovimientosPorArticulo,
  obtenerResumenMovimientos,
  eliminarMovimiento
} from '../controllers/movimientos.controller';
import { verificarToken, soloAdmin, adminOEmpleado } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.post('/', verificarToken, adminOEmpleado, crearMovimiento);
router.get('/', verificarToken, adminOEmpleado, obtenerMovimientos);
router.get('/resumen', verificarToken, soloAdmin, obtenerResumenMovimientos);
router.get('/articulo/:articulo_id', verificarToken, adminOEmpleado, obtenerMovimientosPorArticulo);
router.delete('/:id', verificarToken, soloAdmin, eliminarMovimiento); // Solo admin puede eliminar

export default router;
