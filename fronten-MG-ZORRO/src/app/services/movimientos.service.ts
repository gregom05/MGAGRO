import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface Movimiento {
  id?: number;
  articulo_id: number;
  user_id?: number; // Opcional - el backend lo obtiene del JWT automáticamente
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stock_anterior?: number;
  stock_nuevo?: number;
  motivo: string;
  fecha?: string;
  // Datos del artículo (cuando se hace JOIN)
  codigo?: string;
  nombre?: string;
  unidad_medida?: string;
  // Datos del usuario (cuando se hace JOIN)
  usuario_nombre?: string;
}

export interface ResumenMovimientos {
  tipo: string;
  total_movimientos: string;
  cantidad_total: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private apiUrl = `${API_BASE_URL}/movimientos`;

  constructor(private http: HttpClient) {}

  // Registrar movimiento
  registrarMovimiento(movimiento: Movimiento): Observable<any> {
    return this.http.post(this.apiUrl, movimiento);
  }

  // Obtener todos los movimientos
  obtenerMovimientos(params?: {
    articulo_id?: number;
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(this.apiUrl, { params: params as any });
  }

  // Obtener movimientos por artículo
  obtenerMovimientosPorArticulo(
    articulo_id: number,
    limit?: number
  ): Observable<Movimiento[]> {
    let params: any = {};
    if (limit) {
      params.limit = limit.toString();
    }
    return this.http.get<Movimiento[]>(`${this.apiUrl}/articulo/${articulo_id}`, {
      params
    });
  }

  // Obtener resumen de movimientos
  obtenerResumen(fecha_desde?: string, fecha_hasta?: string): Observable<ResumenMovimientos[]> {
    const params: any = {};
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;
    return this.http.get<ResumenMovimientos[]>(`${this.apiUrl}/resumen`, { params });
  }

  // Eliminar movimiento (solo admin)
  eliminarMovimiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
