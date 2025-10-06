import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActividadesService, Actividad } from '../../services/actividades.service';
import { EmpleadosService, Empleado } from '../../services/empleados.service';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzInputNumberModule,
    NzIconModule
  ],
  templateUrl: './actividades.component.html',
  styleUrls: ['./actividades.component.less']
})
export class ActividadesComponent implements OnInit {
  actividades: Actividad[] = [];
  actividadesOriginales: Actividad[] = []; // Para mantener el array original
  empleados: Empleado[] = [];
  loading = false;
  isModalVisible = false;
  isEditMode = false;
  currentActividad: Actividad = this.getEmptyActividad();
  userRol: string = '';
  userId: number = 0;
  empleadoId: number = 0; // ID del empleado vinculado al usuario
  
  // Filtros
  searchText: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  constructor(
    private actividadesService: ActividadesService,
    private empleadosService: EmpleadosService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // Obtener datos del usuario actual
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRol = user.rol || 'empleado';
    this.userId = user.id || 0;
    
    this.cargarEmpleados();
    this.cargarActividades();
  }

  cargarEmpleados(): void {
    this.empleadosService.obtenerEmpleados(true).subscribe({
      next: (data) => {
        this.empleados = data;
        
        // Si es empleado, buscar su ID de empleado vinculado al usuario
        if (this.userRol === 'empleado') {
          const empleadoActual = data.find(emp => emp.user_id === this.userId);
          if (empleadoActual) {
            this.empleadoId = empleadoActual.id || 0;
            console.log('Empleado ID:', this.empleadoId);
          }
        }
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
      }
    });
  }

  cargarActividades(): void {
    this.loading = true;
    this.actividadesService.obtenerActividades().subscribe({
      next: (data) => {
        // Si es empleado, solo mostrar sus propias actividades
        if (this.userRol === 'empleado' && this.empleadoId > 0) {
          this.actividadesOriginales = data.filter(act => act.empleado_id === this.empleadoId);
          console.log(`Mostrando ${this.actividadesOriginales.length} actividades del empleado`);
        } else {
          // Admin y gerente ven todas
          this.actividadesOriginales = data;
        }
        this.actividades = [...this.actividadesOriginales];
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar actividades:', error);
        this.message.error('Error al cargar las actividades');
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.actividadesOriginales];

    // Filtro por texto en descripción
    if (this.searchText && this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      resultado = resultado.filter(act =>
        act.descripcion?.toLowerCase().includes(search) ||
        act.observaciones?.toLowerCase().includes(search)
      );
    }

    // Filtro por fecha desde
    if (this.fechaDesde) {
      resultado = resultado.filter(act => {
        const fechaAct = new Date(act.fecha).toISOString().split('T')[0];
        return fechaAct >= this.fechaDesde;
      });
    }

    // Filtro por fecha hasta
    if (this.fechaHasta) {
      resultado = resultado.filter(act => {
        const fechaAct = new Date(act.fecha).toISOString().split('T')[0];
        return fechaAct <= this.fechaHasta;
      });
    }

    this.actividades = resultado;
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.aplicarFiltros();
  }

  onSearch(): void {
    this.aplicarFiltros();
  }

  onFechaChange(): void {
    this.aplicarFiltros();
  }

  showModal(actividad?: Actividad): void {
    if (actividad) {
      this.isEditMode = true;
      this.currentActividad = { ...actividad };
    } else {
      this.isEditMode = false;
      this.currentActividad = this.getEmptyActividad();
      
      // Si es empleado, asignar automáticamente su empleado_id
      if (this.userRol === 'empleado' && this.empleadoId > 0) {
        this.currentActividad.empleado_id = this.empleadoId;
      }
    }
    this.isModalVisible = true;
  }

  // Verificar si puede seleccionar empleado (solo admin/gerente)
  puedeSeleccionarEmpleado(): boolean {
    return this.userRol === 'admin' || this.userRol === 'gerente';
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.currentActividad = this.getEmptyActividad();
  }

  handleOk(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.currentActividad.id) {
      this.actividadesService.actualizarActividad(this.currentActividad.id, this.currentActividad).subscribe({
        next: () => {
          this.message.success('Actividad actualizada correctamente');
          this.cargarActividades();
          this.handleCancel();
        },
        error: (error) => {
          console.error('Error al actualizar actividad:', error);
          this.message.error('Error al actualizar la actividad');
          this.loading = false;
        }
      });
    } else {
      this.actividadesService.registrarActividad(this.currentActividad).subscribe({
        next: () => {
          this.message.success('Actividad registrada correctamente');
          this.cargarActividades();
          this.handleCancel();
        },
        error: (error) => {
          console.error('Error al registrar actividad:', error);
          this.message.error('Error al registrar la actividad');
          this.loading = false;
        }
      });
    }
  }

  eliminarActividad(id: number): void {
    this.actividadesService.eliminarActividad(id).subscribe({
      next: () => {
        this.message.success('Actividad eliminada correctamente');
        this.cargarActividades();
      },
      error: (error) => {
        console.error('Error al eliminar actividad:', error);
        this.message.error('Error al eliminar la actividad');
      }
    });
  }

  getNombreEmpleado(empleado_id: number): string {
    const empleado = this.empleados.find(e => e.id === empleado_id);
    return empleado ? `${empleado.nombre} ${empleado.apellido}` : '-';
  }

  private validarFormulario(): boolean {
    if (!this.currentActividad.empleado_id) {
      this.message.error('Debe seleccionar un empleado');
      return false;
    }
    if (!this.currentActividad.fecha) {
      this.message.error('La fecha es obligatoria');
      return false;
    }
    if (!this.currentActividad.descripcion) {
      this.message.error('La descripción es obligatoria');
      return false;
    }
    if (!this.currentActividad.horas || this.currentActividad.horas <= 0) {
      this.message.error('Las horas deben ser mayor a 0');
      return false;
    }
    return true;
  }

  private getEmptyActividad(): Actividad {
    return {
      empleado_id: 0,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      horas: 8,
      observaciones: ''
    };
  }
}
