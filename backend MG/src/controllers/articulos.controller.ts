import { Request, Response } from 'express';
import pool from '../db/db';

// Crear artículo
export const crearArticulo = async (req: Request, res: Response) => {
  const { 
    codigo, nombre, descripcion, categoria, unidad_medida, 
    stock_actual, stock_minimo, precio_unitario 
  } = req.body;

  try {
    const queryText = `
      INSERT INTO Articulos (
        codigo, nombre, descripcion, categoria, unidad_medida, 
        stock_actual, stock_minimo, precio_unitario, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
      RETURNING *
    `;
    const values = [
      codigo, nombre, descripcion || null, categoria || null, 
      unidad_medida || 'unidad', stock_actual || 0, 
      stock_minimo || 0, precio_unitario || null
    ];

    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al crear artículo:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear artículo' });
  }
};

// Obtener todos los artículos
export const obtenerArticulos = async (req: Request, res: Response) => {
  try {
    const { activo, categoria } = req.query;
    let query = 'SELECT * FROM Articulos WHERE 1=1';
    const params: any[] = [];

    if (activo !== undefined) {
      params.push(activo === 'true');
      query += ` AND activo = $${params.length}`;
    }

    if (categoria) {
      params.push(categoria);
      query += ` AND categoria = $${params.length}`;
    }

    query += ' ORDER BY nombre';

    const result = await pool.query(query, params);
    res.json({ 
      success: true, 
      articulos: result.rows 
    });
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener artículos' 
    });
  }
};

// Obtener artículo por ID
export const obtenerArticuloPorId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM Articulos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
};

// Actualizar artículo
export const actualizarArticulo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    codigo, nombre, descripcion, categoria, unidad_medida, 
    stock_minimo, precio_unitario, activo 
  } = req.body;

  try {
    const queryText = `
      UPDATE Articulos 
      SET codigo = $1, nombre = $2, descripcion = $3, categoria = $4, 
          unidad_medida = $5, stock_minimo = $6, precio_unitario = $7, 
          activo = $8, updatedat = CURRENT_TIMESTAMP
      WHERE id = $9 
      RETURNING *
    `;
    const values = [
      codigo, nombre, descripcion, categoria, unidad_medida, 
      stock_minimo, precio_unitario, activo, id
    ];

    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al actualizar artículo:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código ya está registrado' });
    }
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
};

// Eliminar artículo (soft delete)
export const eliminarArticulo = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE Articulos SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    res.json({ message: 'Artículo desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
  }
};

// Buscar artículos
export const buscarArticulos = async (req: Request, res: Response) => {
  const { search } = req.query;

  try {
    const queryText = `
      SELECT * FROM Articulos 
      WHERE (codigo ILIKE $1 OR nombre ILIKE $1 OR descripcion ILIKE $1)
      AND activo = true
      ORDER BY nombre
    `;
    const result = await pool.query(queryText, [`%${search}%`]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al buscar artículos:', error);
    res.status(500).json({ error: 'Error al buscar artículos' });
  }
};

// Obtener artículos con stock bajo (SOLO ADMINISTRADORES)
export const obtenerArticulosStockBajo = async (req: Request & { user?: any }, res: Response) => {
  try {
    console.log('🔔 [STOCK-BAJO] Petición recibida');
    console.log('👤 Usuario:', req.user?.nombre, '| Rol:', req.user?.rol);
    
    // Verificar que el usuario sea administrador
    if (req.user?.rol !== 'admin') {
      console.log('❌ [STOCK-BAJO] Acceso denegado - No es admin');
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden ver las alertas de inventario'
      });
    }

    const queryText = `
      SELECT 
        *,
        CASE 
          WHEN stock_actual = 0 THEN 'critico'
          WHEN stock_actual <= stock_minimo * 0.5 THEN 'bajo'
          WHEN stock_actual <= stock_minimo THEN 'alerta'
          ELSE 'normal'
        END as nivel_alerta
      FROM Articulos 
      WHERE stock_actual <= stock_minimo AND activo = true
      ORDER BY 
        CASE 
          WHEN stock_actual = 0 THEN 1
          WHEN stock_actual <= stock_minimo * 0.5 THEN 2
          ELSE 3
        END,
        stock_actual ASC
    `;
    
    console.log('📊 [STOCK-BAJO] Ejecutando query...');
    const result = await pool.query(queryText);
    
    console.log(`📦 [STOCK-BAJO] Artículos encontrados: ${result.rows.length}`);
    result.rows.forEach(art => {
      console.log(`  - ${art.codigo}: ${art.nombre} (${art.stock_actual}/${art.stock_minimo}) [${art.nivel_alerta}]`);
    });
    
    res.json({
      success: true,
      total: result.rows.length,
      criticos: result.rows.filter(a => a.nivel_alerta === 'critico').length,
      bajos: result.rows.filter(a => a.nivel_alerta === 'bajo').length,
      alertas: result.rows.filter(a => a.nivel_alerta === 'alerta').length,
      articulos: result.rows
    });
  } catch (error) {
    console.error('Error al obtener artículos con stock bajo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener artículos con stock bajo' 
    });
  }
};
