import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  
  // Si existe token, clonamos la request y agregamos el header Authorization
  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedRequest);
  }
  
  // Si no hay token, continuamos con la request original
  return next(req);
};
