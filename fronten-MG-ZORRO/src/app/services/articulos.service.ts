import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

export interface Articulo {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  unidad_medida: string;
  stock_actual?: number;
  stock_minimo: number;
  precio_unitario: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {
  private apiUrl = `${API_BASE_URL}/articulos`;

  constructor(private http: HttpClient) {}

  // Crear artículo
  crearArticulo(articulo: Articulo): Observable<any> {
    return this.http.post(this.apiUrl, articulo);
  }

  // Obtener todos los artículos
  obtenerArticulos(params?: {
    activo?: boolean;
    categoria?: string;
  }): Observable<Articulo[]> {
    return this.http.get<any>(this.apiUrl, { params: params as any }).pipe(
      map((response: any) => {
        if (response.success && response.articulos) {
          return response.articulos;
        }
        return response; // Por compatibilidad con formato antiguo
      })
    );
  }

  // Obtener artículo por ID
  obtenerArticuloPorId(id: number): Observable<Articulo> {
    return this.http.get<Articulo>(`${this.apiUrl}/${id}`);
  }

  // Actualizar artículo
  actualizarArticulo(id: number, articulo: Articulo): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, articulo);
  }

  // Eliminar artículo (soft delete)
  eliminarArticulo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Buscar artículos
  buscarArticulos(search: string): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/buscar`, {
      params: { search }
    });
  }

  // Artículos con stock bajo
  obtenerStockBajo(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/stock-bajo`);
  }
}
