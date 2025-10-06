import { Router } from 'express';
import { login, register, getProfile, cambiarPassword } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile/:id', getProfile);
router.post('/cambiar-password', cambiarPassword);

export default router;