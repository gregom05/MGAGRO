import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nombre: string;
        rol: 'admin' | 'empleado';
        empleado_id?: number;
      };
    }
  }
}

/**
 * Middleware para verificar el token JWT
 */
export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'mg-agro-secret-key-2025';
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      nombre: decoded.nombre,
      rol: decoded.rol,
      empleado_id: decoded.empleado_id
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

/**
 * Middleware para verificar que el usuario sea admin
 */
export const soloAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
    });
  }
  next();
};

/**
 * Middleware para verificar que el usuario sea admin o empleado
 */
export const adminOEmpleado = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'admin' && req.user?.rol !== 'empleado') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Permisos insuficientes.'
    });
  }
  next();
};

/**
 * Middleware para verificar que el empleado solo pueda acceder a sus propios datos
 */
export const soloPropioDato = (req: Request, res: Response, next: NextFunction) => {
  const { empleado_id } = req.params;
  
  // Si es admin, puede acceder a todo
  if (req.user?.rol === 'admin') {
    return next();
  }

  // Si es empleado, solo puede acceder a sus propios datos
  if (req.user?.rol === 'empleado') {
    if (req.user.empleado_id?.toString() === empleado_id) {
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes acceder a tus propias actividades'
      });
    }
  }

  return res.status(403).json({
    success: false,
    message: 'Acceso denegado'
  });
};
