import { Router } from 'express';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../controllers/usuarios.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Solo admin puede gestionar usuarios
router.get('/', verificarToken, soloAdmin, getUsuarios);
router.post('/', verificarToken, soloAdmin, createUsuario);
router.put('/:id', verificarToken, soloAdmin, updateUsuario);
router.delete('/:id', verificarToken, soloAdmin, deleteUsuario);

export default router;
