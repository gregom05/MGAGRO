import { Router } from 'express';
import { 
  crearArticulo, 
  obtenerArticulos, 
  obtenerArticuloPorId, 
  actualizarArticulo, 
  eliminarArticulo,
  buscarArticulos,
  obtenerArticulosStockBajo
} from '../controllers/articulos.controller';
import { verificarToken, soloAdmin, adminOEmpleado, adminEmpleadoOGeneral } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
// admin, empleado y general pueden crear/editar; solo admin puede eliminar
router.post('/', verificarToken, adminEmpleadoOGeneral, crearArticulo);
router.get('/', verificarToken, adminEmpleadoOGeneral, obtenerArticulos);
router.get('/buscar', verificarToken, adminEmpleadoOGeneral, buscarArticulos);
router.get('/stock-bajo', verificarToken, soloAdmin, obtenerArticulosStockBajo); // Solo admin
router.get('/:id', verificarToken, adminEmpleadoOGeneral, obtenerArticuloPorId);
router.put('/:id', verificarToken, adminEmpleadoOGeneral, actualizarArticulo);
router.delete('/:id', verificarToken, soloAdmin, eliminarArticulo); // Solo admin puede eliminar

export default router;
