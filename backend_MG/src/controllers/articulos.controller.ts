import { Request, Response } from 'express';
import { supabase } from '../db/db';

// Crear artículo
export const crearArticulo = async (req: Request, res: Response) => {
  const { codigo, nombre, descripcion, categoria, unidad_medida, stock_actual, stock_minimo, precio_unitario } = req.body;
  try {
    const { data, error } = await supabase.from('articulos').insert([{ codigo, nombre, descripcion: descripcion || null, categoria: categoria || null, unidad_medida: unidad_medida || 'unidad', stock_actual: stock_actual || 0, stock_minimo: stock_minimo || 0, precio_unitario: precio_unitario || null, activo: true }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data && data[0]);
  } catch (error: any) {
    console.error('Error al crear artículo:', error);
    res.status(500).json({ error: 'Error al crear artículo' });
  }
};

// Obtener todos los artículos
export const obtenerArticulos = async (req: Request, res: Response) => {
  try {
    const { activo, categoria } = req.query;
    let query = supabase.from('articulos').select('*');
    if (activo !== undefined) query = query.eq('activo', activo === 'true');
    if (categoria) query = query.eq('categoria', categoria);
    query = query.order('nombre', { ascending: true });
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, articulos: data });
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener artículos' });
  }
};

// Obtener artículo por ID
export const obtenerArticuloPorId = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('articulos').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(data);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: 'Error al obtener artículo' });
  }
};

// Actualizar artículo
export const actualizarArticulo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { codigo, nombre, descripcion, categoria, unidad_medida, stock_minimo, precio_unitario, activo } = req.body;
  try {
    const { data, error } = await supabase.from('articulos').update({ codigo, nombre, descripcion, categoria, unidad_medida, stock_minimo, precio_unitario, activo, updatedat: new Date().toISOString() }).eq('id', id).select();
    if (error || !data || data.length === 0) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json(data[0]);
  } catch (error: any) {
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  }
};

// Eliminar artículo (hard delete)
export const eliminarArticulo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('articulos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message || 'Error al eliminar artículo' });
    res.json({ success: true, message: 'Artículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'Error al eliminar artículo' });
  }
};

// Buscar artículos
export const buscarArticulos = async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    const { data, error } = await supabase.from('articulos').select('*').or(`codigo.ilike.%${search}%,nombre.ilike.%${search}%,descripcion.ilike.%${search}%`).eq('activo', true).order('nombre', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) {
    console.error('Error al buscar artículos:', error);
    res.status(500).json({ error: 'Error al buscar artículos' });
  }
};

// Obtener artículos con stock bajo
export const obtenerArticulosStockBajo = async (req: Request & { user?: any }, res: Response) => {
  try {
    if (req.user?.rol !== 'admin') return res.status(403).json({ success: false, error: 'Solo los administradores pueden ver las alertas de inventario' });
    const { data, error } = await supabase.from('articulos').select('*').eq('activo', true).order('stock_actual', { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    const articulos = (data || []).filter(art => art.stock_actual <= art.stock_minimo).map(art => ({ ...art, nivel_alerta: art.stock_actual === 0 ? 'critico' : art.stock_actual <= art.stock_minimo * 0.5 ? 'bajo' : art.stock_actual <= art.stock_minimo ? 'alerta' : 'normal' }));
    res.json({ success: true, total: articulos.length, criticos: articulos.filter(a => a.nivel_alerta === 'critico').length, bajos: articulos.filter(a => a.nivel_alerta === 'bajo').length, alertas: articulos.filter(a => a.nivel_alerta === 'alerta').length, articulos });
  } catch (error) {
    console.error('Error al obtener artículos con stock bajo:', error);
    res.status(500).json({ success: false, error: 'Error al obtener artículos con stock bajo' });
  }
};
