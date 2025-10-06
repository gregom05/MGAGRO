import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { EmpleadosService } from '../../services/empleados.service';
import { API_BASE_URL } from '../../services/api.config';

@Component({
  selector: 'app-dashboard-empleado',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzStatisticModule,
    NzIconModule,
    NzSpinModule,
    NzGridModule
  ],
  templateUrl: './dashboard-empleado.component.html',
  styleUrls: ['./dashboard-empleado.component.less']
})
export class DashboardEmpleadoComponent implements OnInit {
  loading = true;
  empleadosActivos = 0;
  totalActividades = 0;
  nombreUsuario = '';
  empleadoId: number | null = null;
  today = new Date();

  constructor(
    private empleadosService: EmpleadosService
  ) {}

  ngOnInit(): void {
    // Obtener nombre y empleado_id del usuario
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.nombreUsuario = user.nombre || 'Usuario';
    this.empleadoId = user.empleado_id || null;

    this.cargarEstadisticas();
  }

  async cargarEstadisticas(): Promise<void> {
    this.loading = true;

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Cargar empleados activos
      this.empleadosService.obtenerEmpleados(true).subscribe({
        next: (empleados) => {
          this.empleadosActivos = empleados.length;
        },
        error: (error) => {
          console.error('Error al cargar empleados:', error);
        }
      });

      // Cargar actividades del empleado
      if (this.empleadoId) {
        const actividadesRes = await fetch(`${API_BASE_URL}/actividades`, {
          headers
        });
        const actividadesData = await actividadesRes.json();
        
        if (actividadesData.success && actividadesData.actividades) {
          // Filtrar solo las actividades de este empleado
          const misActividades = actividadesData.actividades.filter(
            (a: any) => a.empleado_id === this.empleadoId
          );
          this.totalActividades = misActividades.length;
          console.log('📋 Total de mis actividades:', this.totalActividades);
        }
      }

    } catch (error) {
      console.error('Error al cargar actividades:', error);
    } finally {
      this.loading = false;
    }
  }
}
