import { Request, Response } from 'express';
import supabase from '../db/db';

// Crear movimiento de inventario (entrada/salida)
export const crearMovimiento = async (req: Request & { user?: any }, res: Response) => {
  const { articulo_id, tipo, cantidad, motivo } = req.body;

  try {
    // Obtener user_id del token JWT (usuario autenticado)
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    // Verificar que el usuario existe
    const { data: userCheck } = await supabase.from('users').select('id').eq('id', user_id);
    if (!userCheck || userCheck.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    // Verificar permisos: solo admin puede hacer ajustes
    if (tipo === 'ajuste' && req.user?.rol !== 'admin') {
      return res.status(403).json({ success: false, error: 'Solo administradores pueden realizar ajustes de inventario' });
    }
    // Obtener el artículo actual con stock_minimo
    const { data: articuloResult } = await supabase
      .from('articulos')
      .select('stock_actual, stock_minimo, nombre, codigo')
      .eq('id', articulo_id)
      .eq('activo', true);
    if (!articuloResult || articuloResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado o inactivo' });
    }
    const articulo = articuloResult[0];
    const stock_anterior = parseFloat(articulo.stock_actual);
    const stock_minimo = parseFloat(articulo.stock_minimo);
    let stock_nuevo = stock_anterior;
    // Calcular el nuevo stock según el tipo de movimiento
    switch (tipo) {
      case 'entrada':
        stock_nuevo = stock_anterior + parseFloat(cantidad);
        break;
      case 'salida':
        stock_nuevo = stock_anterior - parseFloat(cantidad);
        if (stock_nuevo < 0) {
          return res.status(400).json({ success: false, error: `Stock insuficiente. Stock actual: ${stock_anterior}, Cantidad solicitada: ${cantidad}` });
        }
        break;
      case 'ajuste':
        stock_nuevo = parseFloat(cantidad);
        if (stock_nuevo < 0) {
          return res.status(400).json({ success: false, error: 'El ajuste no puede resultar en stock negativo' });
        }
        break;
      default:
        return res.status(400).json({ success: false, error: 'Tipo de movimiento inválido' });
    }
    // Actualizar el stock del artículo
    const { error: updateError } = await supabase
      .from('articulos')
      .update({ stock_actual: stock_nuevo, updatedat: new Date().toISOString() })
      .eq('id', articulo_id);
    if (updateError) throw updateError;
    // Registrar el movimiento
    const { data: movimientoData, error: movimientoError } = await supabase
      .from('movimientosinventario')
      .insert([
        {
          articulo_id,
          user_id,
          tipo,
          cantidad,
          stock_anterior,
          stock_nuevo,
          motivo: motivo || null
        }
      ])
      .select();
    if (movimientoError) throw movimientoError;
    let alerta = null;
    if (req.user?.rol === 'admin' && stock_nuevo <= stock_minimo) {
      alerta = {
        tipo: stock_nuevo === 0 ? 'critico' : 'bajo',
        mensaje: stock_nuevo === 0 
          ? `⚠️ STOCK AGOTADO: ${articulo.nombre} (${articulo.codigo})` 
          : `⚠️ STOCK BAJO: ${articulo.nombre} tiene ${stock_nuevo} unidades (mínimo: ${stock_minimo})`,
        stock_actual: stock_nuevo,
        stock_minimo: stock_minimo,
        articulo: {
          id: articulo_id,
          codigo: articulo.codigo,
          nombre: articulo.nombre
        }
      };
    }
    res.status(201).json({
      success: true,
      data: movimientoData && movimientoData.length > 0 ? movimientoData[0] : null,
      alerta: alerta
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ success: false, error: 'Error al crear movimiento' });
  }
};

// Obtener movimientos con filtros
export const obtenerMovimientos = async (req: Request, res: Response) => {
  const { articulo_id, tipo, fecha_desde, fecha_hasta } = req.query;

  try {
    let query = supabase.from('movimientosinventario').select('*');
    if (articulo_id) query = query.eq('articulo_id', articulo_id);
    if (tipo) query = query.eq('tipo', tipo);
    if (fecha_desde) query = query.gte('fecha', fecha_desde);
    if (fecha_hasta) query = query.lte('fecha', fecha_hasta);
    query = query.order('fecha', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    // Para cada movimiento, obtener info de artículo y usuario
    const movimientos = await Promise.all((data || []).map(async (m) => {
      const { data: articulo } = await supabase.from('articulos').select('codigo, nombre').eq('id', m.articulo_id).single();
      const { data: usuario } = await supabase.from('users').select('nombre').eq('id', m.user_id).single();
      return {
        ...m,
        codigo: articulo?.codigo,
        articulo_nombre: articulo?.nombre,
        usuario_nombre: usuario?.nombre
      };
    }));
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};

// Obtener movimientos por artículo
export const obtenerMovimientosPorArticulo = async (req: Request, res: Response) => {
  const { articulo_id } = req.params;
  const { limit } = req.query;

  try {
    let query = supabase.from('movimientosinventario').select('*').eq('articulo_id', articulo_id).order('fecha', { ascending: false });
    if (limit) query = query.limit(Number(limit));
    const { data, error } = await query;
    if (error) throw error;
    // Agregar nombre de usuario
    const movimientos = await Promise.all((data || []).map(async (m) => {
      const { data: usuario } = await supabase.from('users').select('nombre').eq('id', m.user_id).single();
      return {
        ...m,
        usuario_nombre: usuario?.nombre
      };
    }));
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};

// Obtener resumen de movimientos
export const obtenerResumenMovimientos = async (req: Request, res: Response) => {
  const { fecha_desde, fecha_hasta } = req.query;

  try {
    let query = supabase.from('movimientosinventario').select('tipo, cantidad, fecha');
    if (fecha_desde) query = query.gte('fecha', fecha_desde);
    if (fecha_hasta) query = query.lte('fecha', fecha_hasta);
    const { data, error } = await query;
    if (error) throw error;
    // Agrupar por tipo en JS
    const resumen: any = {};
    (data || []).forEach(m => {
      if (!resumen[m.tipo]) resumen[m.tipo] = { tipo: m.tipo, total_movimientos: 0, cantidad_total: 0 };
      resumen[m.tipo].total_movimientos++;
      resumen[m.tipo].cantidad_total += Number(m.cantidad);
    });
    res.json(Object.values(resumen));
  } catch (error) {
    console.error('Error al obtener resumen de movimientos:', error);
    res.status(500).json({ error: 'Error al obtener resumen de movimientos' });
  }
};

// Eliminar movimiento (SOLO ADMIN y NO el último movimiento)
export const eliminarMovimiento = async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  try {
    // Verificar que sea administrador
    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ success: false, error: 'Solo los administradores pueden eliminar movimientos' });
    }
    // Obtener el movimiento a eliminar
    const { data: movimientoResult } = await supabase
      .from('movimientosinventario')
      .select('*')
      .eq('id', id);
    if (!movimientoResult || movimientoResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
    }
    const movimiento = movimientoResult[0];
    // Verificar que NO sea el último movimiento del artículo
    const { data: ultimoMovimientoResult } = await supabase
      .from('movimientosinventario')
      .select('id')
      .eq('articulo_id', movimiento.articulo_id)
      .order('fecha', { ascending: false })
      .order('id', { ascending: false })
      .limit(1);
    if (ultimoMovimientoResult && ultimoMovimientoResult.length > 0 && ultimoMovimientoResult[0].id === parseInt(id)) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar el último movimiento del artículo. Esto afectaría el stock actual.' });
    }
    // Eliminar el movimiento
    const { error: deleteError } = await supabase
      .from('movimientosinventario')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
    res.json({ success: true, message: 'Movimiento eliminado correctamente', movimiento_eliminado: movimiento });
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar movimiento' });
  }
};
