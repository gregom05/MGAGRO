import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { API_BASE_URL } from '../../services/api.config';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzSpinModule
  ],
  templateUrl: './welcome.html',
  styleUrl: './welcome.less'
})
export class Welcome implements OnInit {
  loading = true;
  
  // Estadísticas
  cantidadEmpleados = 0;
  totalSueldos = 0;
  cantidadArticulos = 0;
  valorTotalStock = 0;

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    this.loading = true;
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };


      const empleadosRes = await fetch(`${API_BASE_URL}/empleados`, {
        headers
      });
      const empleadosData = await empleadosRes.json();
      
      if (empleadosData.success && empleadosData.empleados) {
        const empleadosActivos = empleadosData.empleados.filter((e: any) => e.activo);
        this.cantidadEmpleados = empleadosActivos.length;
        
        this.totalSueldos = empleadosActivos.reduce((sum: number, e: any) => {
          const salario = parseFloat(e.salario) || 0;
          return sum + salario;
        }, 0);
      }

      // Obtener artículos y calcular valor total de stock
      const articulosRes = await fetch(`${API_BASE_URL}/articulos`, {
        headers
      });
      const articulosData = await articulosRes.json();
      
      if (articulosData.success && articulosData.articulos) {
        this.cantidadArticulos = articulosData.articulos.length;
        
        this.valorTotalStock = articulosData.articulos.reduce((sum: number, a: any) => {
          const stock = parseFloat(a.stock_actual) || 0;
          const precio = parseFloat(a.precio_unitario) || 0;
          const valorItem = stock * precio;
          return sum + valorItem;
        }, 0);
      }

    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
    } finally {
      this.loading = false;
    }
  }

  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
