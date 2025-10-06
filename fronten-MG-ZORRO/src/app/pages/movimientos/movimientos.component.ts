import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { MovimientosService, Movimiento } from '../../services/movimientos.service';
import { ArticulosService, Articulo } from '../../services/articulos.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzIconModule,
    NzTagModule,
    NzRadioModule,
    NzToolTipModule,
    NzPopconfirmModule
  ],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.less']
})
export class MovimientosComponent implements OnInit {
  movimientos: Movimiento[] = [];
  movimientosFiltrados: Movimiento[] = [];
  articulos: Articulo[] = [];
  loading = false;
  isModalVisible = false;
  currentMovimiento: Movimiento = this.getEmptyMovimiento();
  articuloSeleccionado?: Articulo;
  searchText: string = '';
  articuloFiltro: number | null = null;
  fechaDesde: string = ''; // Filtro fecha desde
  fechaHasta: string = ''; // Filtro fecha hasta
  userRol: string = ''; // Rol del usuario para permisos

  constructor(
    private movimientosService: MovimientosService,
    private articulosService: ArticulosService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // Obtener rol del usuario
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userRol = user.rol || 'empleado';
    
    this.cargarArticulos();
    this.cargarMovimientos();
  }

  // Solo admin puede eliminar movimientos
  puedeEliminarMovimientos(): boolean {
    return this.userRol === 'admin';
  }

  // Solo admin y gerente pueden usar tipo "ajuste"
  puedeUsarAjuste(): boolean {
    return this.userRol === 'admin' || this.userRol === 'gerente';
  }

  // Obtener tipos de movimiento disponibles según rol
  getTiposMovimiento(): Array<{value: string, label: string}> {
    const tipos = [
      { value: 'entrada', label: 'Entrada' },
      { value: 'salida', label: 'Salida' }
    ];
    
    // Solo admin y gerente pueden usar "ajuste"
    if (this.puedeUsarAjuste()) {
      tipos.push({ value: 'ajuste', label: 'Ajuste' });
    }
    
    return tipos;
  }

  cargarArticulos(): void {
    this.articulosService.obtenerArticulos({ activo: true }).subscribe({
      next: (data) => {
        this.articulos = data;
      },
      error: (error) => {
        console.error('Error al cargar artículos:', error);
      }
    });
  }

  cargarMovimientos(): void {
    this.loading = true;
    this.movimientosService.obtenerMovimientos().subscribe({
      next: (data) => {
        this.movimientos = data;
        this.movimientosFiltrados = data;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar movimientos:', error);
        this.message.error('Error al cargar los movimientos');
        this.loading = false;
      }
    });
  }

  showModal(): void {
    this.currentMovimiento = this.getEmptyMovimiento();
    this.articuloSeleccionado = undefined;
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.currentMovimiento = this.getEmptyMovimiento();
    this.articuloSeleccionado = undefined;
  }

  onArticuloChange(articulo_id: number): void {
    this.articuloSeleccionado = this.articulos.find(a => a.id === articulo_id);
  }

  handleOk(): void {
    if (!this.validarFormulario()) {
      return;
    }

    // NO enviar user_id - el backend lo obtiene del token JWT automáticamente
    // Eliminar user_id si existe para evitar conflictos
    const { user_id, ...movimientoData } = this.currentMovimiento;

    this.loading = true;
    this.movimientosService.registrarMovimiento(movimientoData).subscribe({
      next: () => {
        this.message.success('Movimiento registrado correctamente');
        this.cargarMovimientos();
        this.cargarArticulos(); // Recargar para actualizar stock
        this.handleCancel();
      },
      error: (error) => {
        console.error('Error al registrar movimiento:', error);
        this.message.error('Error al registrar el movimiento');
        this.loading = false;
      }
    });
  }

  getTipoColor(tipo: string): string {
    switch (tipo) {
      case 'entrada':
        return 'green';
      case 'salida':
        return 'red';
      case 'ajuste':
        return 'blue';
      default:
        return 'default';
    }
  }

  getNombreArticulo(articulo_id: number): string {
    const articulo = this.articulos.find(a => a.id === articulo_id);
    return articulo ? `${articulo.codigo} - ${articulo.nombre}` : '-';
  }

  private validarFormulario(): boolean {
    if (!this.currentMovimiento.articulo_id) {
      this.message.error('Debe seleccionar un artículo');
      return false;
    }
    if (!this.currentMovimiento.tipo) {
      this.message.error('Debe seleccionar el tipo de movimiento');
      return false;
    }
    if (!this.currentMovimiento.cantidad || this.currentMovimiento.cantidad <= 0) {
      this.message.error('La cantidad debe ser mayor a 0');
      return false;
    }
    if (!this.currentMovimiento.motivo) {
      this.message.error('El motivo es obligatorio');
      return false;
    }

    // Validar que haya stock suficiente para salidas
    if (this.currentMovimiento.tipo === 'salida' && this.articuloSeleccionado) {
      const stockActual = this.articuloSeleccionado.stock_actual || 0;
      if (this.currentMovimiento.cantidad > stockActual) {
        this.message.error(`Stock insuficiente. Stock actual: ${stockActual}`);
        return false;
      }
    }

    return true;
  }

  calcularStockResultante(): number {
    if (!this.articuloSeleccionado) return 0;
    
    const stockActual = Number(this.articuloSeleccionado.stock_actual || 0);
    const cantidad = Number(this.currentMovimiento.cantidad || 0);
    
    switch (this.currentMovimiento.tipo) {
      case 'entrada':
        return stockActual + cantidad;
      case 'salida':
        return stockActual - cantidad;
      case 'ajuste':
        return cantidad;
      default:
        return stockActual;
    }
  }

  getColorStockResultante(): string {
    if (!this.articuloSeleccionado) return 'black';
    
    const stockResultante = this.calcularStockResultante();
    const stockMinimo = Number(this.articuloSeleccionado.stock_minimo || 0);
    
    if (stockResultante <= 0) return 'red';
    if (stockResultante <= stockMinimo) return 'orange';
    return 'green';
  }

  esAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.rol === 'admin';
  }

  esUltimoMovimiento(movimiento: Movimiento): boolean {
    // Filtrar movimientos del mismo artículo
    const movimientosArticulo = this.movimientos
      .filter(m => m.articulo_id === movimiento.articulo_id)
      .sort((a, b) => {
        const fechaA = new Date(a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha || 0).getTime();
        return fechaB - fechaA; // Más reciente primero
      });

    // Verificar si es el primero (más reciente)
    return movimientosArticulo.length > 0 && movimientosArticulo[0].id === movimiento.id;
  }

  confirmarEliminar(movimiento: Movimiento): void {
    if (this.esUltimoMovimiento(movimiento)) {
      this.message.warning('No se puede eliminar el último movimiento de un artículo');
      return;
    }

    this.message.loading('Eliminando movimiento...', { nzDuration: 0 });
    
    this.movimientosService.eliminarMovimiento(movimiento.id!).subscribe({
      next: (response) => {
        this.message.remove();
        this.message.success('Movimiento eliminado correctamente');
        this.cargarMovimientos();
        this.cargarArticulos(); // Recargar artículos por si afecta el stock
      },
      error: (error) => {
        this.message.remove();
        console.error('Error al eliminar movimiento:', error);
        const errorMsg = error.error?.error || 'Error al eliminar el movimiento';
        this.message.error(errorMsg);
      }
    });
  }

  onSearch(): void {
    this.aplicarFiltros();
  }

  onArticuloFiltroChange(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.articuloFiltro = null;
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.aplicarFiltros();
  }

  onFechaChange(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let resultados = [...this.movimientos];

    // Filtrar por artículo seleccionado
    if (this.articuloFiltro) {
      resultados = resultados.filter(m => m.articulo_id === this.articuloFiltro);
    }

    // Filtrar por texto de búsqueda (código, nombre del artículo, motivo)
    if (this.searchText && this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      resultados = resultados.filter(m => {
        const codigo = m.codigo?.toLowerCase() || '';
        const nombre = m.nombre?.toLowerCase() || '';
        const motivo = m.motivo?.toLowerCase() || '';
        const usuario = m.usuario_nombre?.toLowerCase() || '';
        
        return codigo.includes(searchLower) || 
               nombre.includes(searchLower) || 
               motivo.includes(searchLower) ||
               usuario.includes(searchLower);
      });
    }

    // Filtrar por fecha desde
    if (this.fechaDesde) {
      resultados = resultados.filter(m => {
        if (!m.fecha) return false;
        const fechaMov = new Date(m.fecha).toISOString().split('T')[0];
        return fechaMov >= this.fechaDesde;
      });
    }

    // Filtrar por fecha hasta
    if (this.fechaHasta) {
      resultados = resultados.filter(m => {
        if (!m.fecha) return false;
        const fechaMov = new Date(m.fecha).toISOString().split('T')[0];
        return fechaMov <= this.fechaHasta;
      });
    }

    this.movimientosFiltrados = resultados;
  }

  private getEmptyMovimiento(): Movimiento {
    return {
      articulo_id: 0,
      user_id: 1,
      tipo: 'entrada',
      cantidad: 0,
      motivo: ''
    };
  }
}
