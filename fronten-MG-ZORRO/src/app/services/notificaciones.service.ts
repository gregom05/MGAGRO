import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { tap } from 'rxjs/operators';

export interface AlertaStock {
  id: number;
  codigo: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  nivel: 'critico' | 'bajo' | 'alerta';
  nivel_alerta: string;
  mensaje?: string;
}

interface RespuestaStockBajo {
  success: boolean;
  total: number;
  criticos: number;
  bajos: number;
  alertas: number;
  articulos: AlertaStock[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private alertasSubject = new BehaviorSubject<AlertaStock[]>([]);
  public alertas$ = this.alertasSubject.asObservable();
  
  private contadorSubject = new BehaviorSubject<number>(0);
  public contador$ = this.contadorSubject.asObservable();

  constructor(private http: HttpClient) {
    // NO cargar en el constructor - se cargará desde el componente
    // Solo configurar el intervalo de actualización automática cada 30 segundos
    interval(30000).subscribe(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.rol === 'admin') {
        console.log('🔄 Actualización automática de alertas...');
        this.cargarAlertas();
      }
    });
  }

  cargarAlertas(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Solo admin puede ver alertas
    if (user.rol !== 'admin') {
      console.log('ℹ️ Usuario no es admin - No se cargan alertas');
      this.alertasSubject.next([]);
      this.contadorSubject.next(0);
      return;
    }

    console.log('📡 Consultando alertas de stock al backend...');
    
    this.http.get<RespuestaStockBajo>(`${API_BASE_URL}/articulos/stock-bajo`).pipe(
      tap(response => {
        console.log('📦 Respuesta del backend:', response);
        
        if (response.success && response.articulos) {
          // Mapear los artículos al formato de AlertaStock
          const alertas = response.articulos.map(art => ({
            ...art,
            nivel: art.nivel_alerta as 'critico' | 'bajo' | 'alerta',
            mensaje: this.generarMensaje(art)
          }));
          
          this.alertasSubject.next(alertas);
          this.contadorSubject.next(response.total);
          
          // Log detallado
          if (response.total > 0) {
            console.log(`⚠️ ${response.total} alertas encontradas:`);
            console.log(`  🔴 Críticos: ${response.criticos}`);
            console.log(`  🟠 Bajos: ${response.bajos}`);
            console.log(`  🟡 Alertas: ${response.alertas}`);
            alertas.forEach(a => {
              console.log(`  - ${a.codigo}: ${a.nombre} (Stock: ${a.stock_actual}/${a.stock_minimo})`);
            });
          } else {
            console.log('✅ No hay alertas de stock');
          }
        } else {
          this.alertasSubject.next([]);
          this.contadorSubject.next(0);
          console.log('ℹ️ Respuesta vacía del backend');
        }
      })
    ).subscribe({
      error: (error) => {
        console.error('❌ Error al cargar alertas:', error);
        console.error('   Detalles:', error.error);
        this.alertasSubject.next([]);
        this.contadorSubject.next(0);
      }
    });
  }

  private generarMensaje(articulo: AlertaStock): string {
    if (articulo.stock_actual === 0) {
      return `⚠️ CRÍTICO: ${articulo.nombre} AGOTADO`;
    } else if (articulo.nivel_alerta === 'bajo') {
      return `⚠️ Stock muy bajo: ${articulo.nombre}`;
    } else {
      return `⚠️ Stock bajo: ${articulo.nombre}`;
    }
  }

  marcarComoVisto(): void {
    // Por ahora solo limpia el contador visual
    // En el futuro podrías implementar un sistema de "leído/no leído"
  }

  getAlertas(): AlertaStock[] {
    return this.alertasSubject.value;
  }

  getContador(): number {
    return this.contadorSubject.value;
  }
}
