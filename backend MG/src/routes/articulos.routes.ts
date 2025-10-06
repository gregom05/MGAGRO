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
import { verificarToken, soloAdmin, adminOEmpleado } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.post('/', verificarToken, adminOEmpleado, crearArticulo);
router.get('/', verificarToken, adminOEmpleado, obtenerArticulos);
router.get('/buscar', verificarToken, adminOEmpleado, buscarArticulos);
router.get('/stock-bajo', verificarToken, soloAdmin, obtenerArticulosStockBajo); // Solo admin
router.get('/:id', verificarToken, adminOEmpleado, obtenerArticuloPorId);
router.put('/:id', verificarToken, adminOEmpleado, actualizarArticulo);
router.delete('/:id', verificarToken, soloAdmin, eliminarArticulo); // Solo admin puede eliminar

export default router;
