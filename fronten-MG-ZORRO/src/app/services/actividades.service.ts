import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface Actividad {
  id?: number;
  empleado_id: number;
  fecha: string;
  descripcion: string;
  horas: number;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  // Datos del empleado (cuando se hace JOIN)
  nombre?: string;
  apellido?: string;
}

export interface ResumenActividades {
  empleado_id: number;
  nombre: string;
  apellido: string;
  total_horas: string;
  total_actividades: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private apiUrl = `${API_BASE_URL}/actividades`;

  constructor(private http: HttpClient) {}

  // Registrar actividad
  registrarActividad(actividad: Actividad): Observable<any> {
    return this.http.post(this.apiUrl, actividad);
  }

  // Obtener todas las actividades
  obtenerActividades(params?: {
    empleado_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.apiUrl, { params: params as any });
  }

  // Obtener actividades por empleado
  obtenerActividadesPorEmpleado(
    empleado_id: number,
    fecha_desde?: string
  ): Observable<Actividad[]> {
    let params: any = {};
    if (fecha_desde) {
      params.fecha_desde = fecha_desde;
    }
    return this.http.get<Actividad[]>(`${this.apiUrl}/empleado/${empleado_id}`, {
      params
    });
  }

  // Obtener actividad por ID
  obtenerActividadPorId(id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.apiUrl}/${id}`);
  }

  // Actualizar actividad
  actualizarActividad(id: number, actividad: Actividad): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, actividad);
  }

  // Eliminar actividad
  eliminarActividad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Obtener resumen de horas por empleado
  obtenerResumen(fecha_desde?: string, fecha_hasta?: string): Observable<ResumenActividades[]> {
    const params: any = {};
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;
    return this.http.get<ResumenActividades[]>(`${this.apiUrl}/resumen`, { params });
  }
}
