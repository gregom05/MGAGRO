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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { EmpleadosService, Empleado } from '../../services/empleados.service';

@Component({
  selector: 'app-empleados',
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
    NzDatePickerModule,
    NzInputNumberModule,
    NzIconModule,
    NzSwitchModule,
    NzTagModule
  ],
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.less']
})
export class EmpleadosComponent implements OnInit {
  empleados: Empleado[] = [];
  loading = false;
  isModalVisible = false;
  isEditMode = false;
  currentEmpleado: Empleado = this.getEmptyEmpleado();
  passwordVisible = false; // Para mostrar/ocultar contraseña

  constructor(
    private empleadosService: EmpleadosService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.loading = true;
    // Solo cargar empleados activos
    this.empleadosService.obtenerEmpleados(true).subscribe({
      next: (data) => {
        this.empleados = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.message.error('Error al cargar los empleados');
        this.loading = false;
      }
    });
  }

  showModal(empleado?: Empleado): void {
    if (empleado) {
      this.isEditMode = true;
      this.currentEmpleado = { ...empleado };
      
      // Convertir fecha_ingreso al formato YYYY-MM-DD para el input type="date"
      if (this.currentEmpleado.fecha_ingreso) {
        const fecha = new Date(this.currentEmpleado.fecha_ingreso);
        if (!isNaN(fecha.getTime())) {
          // Formatear a YYYY-MM-DD
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          this.currentEmpleado.fecha_ingreso = `${year}-${month}-${day}`;
        }
      }
    } else {
      this.isEditMode = false;
      this.currentEmpleado = this.getEmptyEmpleado();
    }
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.currentEmpleado = this.getEmptyEmpleado();
    this.passwordVisible = false;
  }

  handleOk(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.currentEmpleado.id) {
      this.empleadosService.actualizarEmpleado(this.currentEmpleado.id, this.currentEmpleado).subscribe({
        next: () => {
          this.message.success('Empleado actualizado correctamente');
          this.cargarEmpleados();
          this.handleCancel();
        },
        error: (error) => {
          console.error('Error al actualizar empleado:', error);
          this.message.error('Error al actualizar el empleado');
          this.loading = false;
        }
      });
    } else {
      this.empleadosService.crearEmpleado(this.currentEmpleado).subscribe({
        next: () => {
          this.message.success('Empleado creado correctamente');
          this.cargarEmpleados();
          this.handleCancel();
        },
        error: (error) => {
          console.error('Error al crear empleado:', error);
          this.message.error('Error al crear el empleado');
          this.loading = false;
        }
      });
    }
  }

  eliminarEmpleado(id: number): void {
    this.empleadosService.eliminarEmpleado(id).subscribe({
      next: () => {
        this.message.success('Empleado eliminado correctamente');
        this.cargarEmpleados();
      },
      error: (error) => {
        console.error('Error al eliminar empleado:', error);
        this.message.error('Error al eliminar el empleado');
      }
    });
  }

  private validarFormulario(): boolean {
    if (!this.currentEmpleado.nombre || !this.currentEmpleado.apellido) {
      this.message.error('El nombre y apellido son obligatorios');
      return false;
    }
    if (!this.currentEmpleado.documento) {
      this.message.error('El documento es obligatorio');
      return false;
    }
    
    // Validaciones solo al crear empleado (se crea usuario automáticamente)
    if (!this.isEditMode) {
      if (!this.currentEmpleado.email || !this.currentEmpleado.email.trim()) {
        this.message.error('El email es obligatorio para crear el usuario');
        return false;
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.currentEmpleado.email)) {
        this.message.error('El formato del email no es válido');
        return false;
      }
      
      if (!this.currentEmpleado.password || !this.currentEmpleado.password.trim()) {
        this.message.error('La contraseña es obligatoria para crear el usuario');
        return false;
      }
      
      if (this.currentEmpleado.password.length < 6) {
        this.message.error('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
    }
    
    if (!this.currentEmpleado.fecha_ingreso) {
      this.message.error('La fecha de ingreso es obligatoria');
      return false;
    }
    if (!this.currentEmpleado.puesto) {
      this.message.error('El puesto es obligatorio');
      return false;
    }
    if (!this.currentEmpleado.salario || this.currentEmpleado.salario <= 0) {
      this.message.error('El salario debe ser mayor a 0');
      return false;
    }
    return true;
  }

  private getEmptyEmpleado(): Empleado {
    return {
      nombre: '',
      apellido: '',
      documento: '',
      telefono: '',
      email: '',
      direccion: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      puesto: '',
      salario: 0,
      activo: true
    };
  }

  formatterDollar = (value: number): string => `$ ${value}`;
  parserDollar = (value: string): number => parseFloat(value.replace(/\$\s?|(,*)/g, '')) || 0;
}
