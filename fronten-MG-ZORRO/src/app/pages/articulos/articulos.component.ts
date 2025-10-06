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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ArticulosService, Articulo } from '../../services/articulos.service';

@Component({
  selector: 'app-articulos',
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
    NzInputNumberModule,
    NzIconModule,
    NzSwitchModule,
    NzTagModule,
    NzSelectModule
  ],
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.less']
})
export class ArticulosComponent implements OnInit {
  articulos: Articulo[] = [];
  articulosFiltrados: Articulo[] = [];
  loading = false;
  isModalVisible = false;
  isEditMode = false;
  currentArticulo: Articulo = this.getEmptyArticulo();
  searchText: string = '';
  stockFilter: 'todos' | 'bajo' | 'normal' = 'todos';
  userRol: string = ''; // Rol del usuario para permisos

  constructor(
    private articulosService: ArticulosService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // Obtener rol del usuario
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRol = user.rol || 'empleado';
    
    this.cargarArticulos();
  }

  // Verificar si el usuario puede gestionar artículos (crear/editar/eliminar)
  puedeGestionarArticulos(): boolean {
    return this.userRol === 'admin' || this.userRol === 'gerente';
  }

  cargarArticulos(): void {
    this.loading = true;
    this.articulosService.obtenerArticulos().subscribe({
      next: (data) => {
        this.articulos = data;
        this.articulosFiltrados = data;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar artículos:', error);
        this.message.error('Error al cargar los artículos');
        this.loading = false;
      }
    });
  }

  showModal(articulo?: Articulo): void {
    if (articulo) {
      this.isEditMode = true;
      this.currentArticulo = { ...articulo };
    } else {
      this.isEditMode = false;
      this.currentArticulo = this.getEmptyArticulo();
    }
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.currentArticulo = this.getEmptyArticulo();
  }

  handleOk(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.currentArticulo.id) {
      this.articulosService.actualizarArticulo(this.currentArticulo.id, this.currentArticulo).subscribe({
        next: () => {
          this.message.success('Artículo actualizado correctamente');
          this.cargarArticulos();
          this.handleCancel();
        },
        error: (error) => {
          console.error('Error al actualizar artículo:', error);
          this.message.error('Error al actualizar el artículo');
          this.loading = false;
        }
      });
    } else {
      this.articulosService.crearArticulo(this.currentArticulo).subscribe({
        next: () => {
          this.message.success('Artículo creado correctamente');
          this.cargarArticulos();
          this.handleCancel();
        },
        error: (error) => {
          console.error('Error al crear artículo:', error);
          this.message.error('Error al crear el artículo');
          this.loading = false;
        }
      });
    }
  }

  eliminarArticulo(id: number): void {
    this.articulosService.eliminarArticulo(id).subscribe({
      next: () => {
        this.message.success('Artículo eliminado correctamente');
        this.cargarArticulos();
      },
      error: (error) => {
        console.error('Error al eliminar artículo:', error);
        this.message.error('Error al eliminar el artículo');
      }
    });
  }

  getStockStatus(articulo: Articulo): { color: string; text: string } {
    if (articulo.stock_actual === undefined || articulo.stock_actual === null) {
      return { color: 'default', text: 'N/A' };
    }
    if (articulo.stock_actual <= articulo.stock_minimo) {
      return { color: 'red', text: 'BAJO' };
    }
    if (articulo.stock_actual <= articulo.stock_minimo * 1.5) {
      return { color: 'orange', text: 'MEDIO' };
    }
    return { color: 'green', text: 'NORMAL' };
  }

  private validarFormulario(): boolean {
    if (!this.currentArticulo.codigo) {
      this.message.error('El código es obligatorio');
      return false;
    }
    if (!this.currentArticulo.nombre) {
      this.message.error('El nombre es obligatorio');
      return false;
    }
    if (!this.currentArticulo.categoria) {
      this.message.error('La categoría es obligatoria');
      return false;
    }
    if (!this.currentArticulo.unidad_medida) {
      this.message.error('La unidad de medida es obligatoria');
      return false;
    }
    if (!this.currentArticulo.stock_minimo || this.currentArticulo.stock_minimo < 0) {
      this.message.error('El stock mínimo debe ser mayor o igual a 0');
      return false;
    }
    if (!this.currentArticulo.precio_unitario || this.currentArticulo.precio_unitario <= 0) {
      this.message.error('El precio unitario debe ser mayor a 0');
      return false;
    }
    return true;
  }

  private getEmptyArticulo(): Articulo {
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      unidad_medida: '',
      stock_actual: 0,
      stock_minimo: 0,
      precio_unitario: 0,
      activo: true
    };
  }

  onSearch(): void {
    this.aplicarFiltros();
  }

  onStockFilterChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.stockFilter = 'todos';
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let resultados = [...this.articulos];

    // Filtrar por texto de búsqueda (código, nombre, categoría, descripción)
    if (this.searchText && this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      resultados = resultados.filter(a => {
        const codigo = a.codigo?.toLowerCase() || '';
        const nombre = a.nombre?.toLowerCase() || '';
        const categoria = a.categoria?.toLowerCase() || '';
        const descripcion = a.descripcion?.toLowerCase() || '';
        
        return codigo.includes(searchLower) || 
               nombre.includes(searchLower) || 
               categoria.includes(searchLower) ||
               descripcion.includes(searchLower);
      });
    }

    // Filtrar por estado de stock
    if (this.stockFilter === 'bajo') {
      resultados = resultados.filter(a => 
        (a.stock_actual ?? 0) <= a.stock_minimo
      );
    } else if (this.stockFilter === 'normal') {
      resultados = resultados.filter(a => 
        (a.stock_actual ?? 0) > a.stock_minimo
      );
    }

    this.articulosFiltrados = resultados;
  }

  formatterDollar = (value: number): string => `$ ${value}`;
  parserDollar = (value: string): number => parseFloat(value.replace(/\$\s?|(,*)/g, '')) || 0;
}
