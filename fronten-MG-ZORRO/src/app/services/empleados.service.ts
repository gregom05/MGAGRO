import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

export interface Empleado {
  id?: number;
  user_id?: number; // ID del usuario vinculado
  nombre: string;
  apellido: string;
  documento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_ingreso: string;
  puesto: string;
  salario: number;
  password?: string; // Solo para creación - se crea usuario automáticamente
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private apiUrl = `${API_BASE_URL}/empleados`;

  constructor(private http: HttpClient) {}

  // Crear empleado
  crearEmpleado(empleado: Empleado): Observable<any> {
    return this.http.post(this.apiUrl, empleado);
  }

  // Obtener todos los empleados
  obtenerEmpleados(activo?: boolean): Observable<Empleado[]> {
    let params: any = {};
    if (activo !== undefined) {
      params.activo = activo.toString();
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response: any) => {
        if (response.success && response.empleados) {
          return response.empleados;
        }
        return response; // Por compatibilidad con formato antiguo
      })
    );
  }

  // Obtener empleado por ID
  obtenerEmpleadoPorId(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`);
  }

  // Actualizar empleado
  actualizarEmpleado(id: number, empleado: Empleado): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, empleado);
  }

  // Eliminar empleado (soft delete)
  eliminarEmpleado(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Buscar empleados
  buscarEmpleados(search: string): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}/buscar`, {
      params: { search }
    });
  }
}
