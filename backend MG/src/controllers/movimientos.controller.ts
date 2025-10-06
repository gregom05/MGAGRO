import { Request, Response } from 'express';
import pool from '../db/db';

// Crear movimiento de inventario (entrada/salida)
export const crearMovimiento = async (req: Request & { user?: any }, res: Response) => {
  const { articulo_id, tipo, cantidad, motivo } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Obtener user_id del token JWT (usuario autenticado)
    const user_id = req.user?.id;
    
    if (!user_id) {
      await client.query('ROLLBACK');
      return res.status(401).json({ 
        success: false,
        error: 'Usuario no autenticado' 
      });
    }

    // Verificar que el usuario existe
    const userCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    // Verificar permisos: solo admin puede hacer ajustes
    if (tipo === 'ajuste' && req.user?.rol !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false,
        error: 'Solo administradores pueden realizar ajustes de inventario' 
      });
    }

    // Obtener el artículo actual con stock_minimo
    const articuloResult = await client.query(
      'SELECT stock_actual, stock_minimo, nombre, codigo FROM articulos WHERE id = $1 AND activo = true',
      [articulo_id]
    );

    if (articuloResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Artículo no encontrado o inactivo' 
      });
    }

    const articulo = articuloResult.rows[0];
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
        // Solo validar que no sea negativo (puede llegar a 0)
        if (stock_nuevo < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            success: false,
            error: `Stock insuficiente. Stock actual: ${stock_anterior}, Cantidad solicitada: ${cantidad}` 
          });
        }
        break;
      case 'ajuste':
        stock_nuevo = parseFloat(cantidad);
        // Validar que el ajuste no sea negativo
        if (stock_nuevo < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            success: false,
            error: 'El ajuste no puede resultar en stock negativo' 
          });
        }
        break;
      default:
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false,
          error: 'Tipo de movimiento inválido' 
        });
    }

    // Actualizar el stock del artículo
    await client.query(
      'UPDATE articulos SET stock_actual = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2',
      [stock_nuevo, articulo_id]
    );

    // Registrar el movimiento
    const movimientoQuery = `
      INSERT INTO movimientosinventario (
        articulo_id, user_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    const movimientoResult = await client.query(movimientoQuery, [
      articulo_id, user_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo || null
    ]);

    // Preparar respuesta con alerta SOLO para administradores
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

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      data: movimientoResult.rows[0],
      alerta: alerta // null si no es admin o si el stock está OK
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear movimiento' 
    });
  } finally {
    client.release();
  }
};

// Obtener movimientos con filtros
export const obtenerMovimientos = async (req: Request, res: Response) => {
  const { articulo_id, tipo, fecha_desde, fecha_hasta } = req.query;

  try {
    let query = `
      SELECT m.*, a.codigo, a.nombre as articulo_nombre, u.nombre as usuario_nombre
      FROM MovimientosInventario m
      JOIN Articulos a ON m.articulo_id = a.id
      LEFT JOIN Users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (articulo_id) {
      params.push(articulo_id);
      query += ` AND m.articulo_id = $${params.length}`;
    }

    if (tipo) {
      params.push(tipo);
      query += ` AND m.tipo = $${params.length}`;
    }

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND m.fecha >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND m.fecha <= $${params.length}`;
    }

    query += ' ORDER BY m.fecha DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
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
    let query = `
      SELECT m.*, u.nombre as usuario_nombre
      FROM MovimientosInventario m
      LEFT JOIN Users u ON m.user_id = u.id
      WHERE m.articulo_id = $1
      ORDER BY m.fecha DESC
    `;

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await pool.query(query, [articulo_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};

// Obtener resumen de movimientos
export const obtenerResumenMovimientos = async (req: Request, res: Response) => {
  const { fecha_desde, fecha_hasta } = req.query;

  try {
    let query = `
      SELECT 
        tipo,
        COUNT(*) as total_movimientos,
        SUM(cantidad) as cantidad_total
      FROM MovimientosInventario
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND fecha >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND fecha <= $${params.length}`;
    }

    query += ' GROUP BY tipo ORDER BY tipo';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener resumen de movimientos:', error);
    res.status(500).json({ error: 'Error al obtener resumen de movimientos' });
  }
};

// Eliminar movimiento (SOLO ADMIN y NO el último movimiento)
export const eliminarMovimiento = async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que sea administrador
    if (req.user?.rol !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false,
        error: 'Solo los administradores pueden eliminar movimientos' 
      });
    }

    // Obtener el movimiento a eliminar
    const movimientoResult = await client.query(
      'SELECT * FROM movimientosinventario WHERE id = $1',
      [id]
    );

    if (movimientoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        error: 'Movimiento no encontrado' 
      });
    }

    const movimiento = movimientoResult.rows[0];

    // Verificar que NO sea el último movimiento del artículo
    const ultimoMovimientoResult = await client.query(
      `SELECT id FROM movimientosinventario 
       WHERE articulo_id = $1 
       ORDER BY fecha DESC, id DESC 
       LIMIT 1`,
      [movimiento.articulo_id]
    );

    if (ultimoMovimientoResult.rows[0].id === parseInt(id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: 'No se puede eliminar el último movimiento del artículo. Esto afectaría el stock actual.' 
      });
    }

    // Eliminar el movimiento
    await client.query(
      'DELETE FROM movimientosinventario WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Movimiento eliminado correctamente',
      movimiento_eliminado: movimiento
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar movimiento' 
    });
  } finally {
    client.release();
  }
};
