import { Request, Response } from 'express';
import { supabase } from '../db/db';

// Crear actividad
export const crearActividad = async (req: Request, res: Response) => {
  const { empleado_id, fecha, descripcion, hectareas, observaciones } = req.body;

  try {
    const { data, error } = await supabase
      .from('actividades')
      .insert([
        { empleado_id, fecha, descripcion, hectareas, observaciones }
      ])
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data && data[0]);
  } catch (error: any) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: 'Error al crear actividad' });
  }
};

// Obtener actividades con filtros
export const obtenerActividades = async (req: Request & { user?: any }, res: Response) => {
  const { empleado_id, fecha_desde, fecha_hasta } = req.query;
  try {
    let query = supabase.from('actividades').select('*');
    
    // Si el usuario es empleado, SOLO puede ver sus propias actividades (forzar filtro)
    if (req.user?.rol === 'empleado') {
      if (!req.user?.empleado_id) {
        return res.status(403).json({ success: false, error: 'Empleado no vinculado al usuario' });
      }
      query = query.eq('empleado_id', req.user.empleado_id);
    } else if (empleado_id) {
      // Admin/gerente puede filtrar por empleado_id
      query = query.eq('empleado_id', empleado_id);
    }
    
    if (fecha_desde) {
      query = query.gte('fecha', fecha_desde);
    }
    if (fecha_hasta) {
      query = query.lte('fecha', fecha_hasta);
    }
    query = query.order('fecha', { ascending: false });
    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, actividades: data });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ success: false, error: 'Error al obtener actividades' });
  }
};

// Obtener actividades por empleado
export const obtenerActividadesPorEmpleado = async (req: Request & { user?: any }, res: Response) => {
  const { empleado_id } = req.params;
  const { fecha_desde, fecha_hasta } = req.query;

  try {
    // Si el usuario es empleado, solo puede ver sus propias actividades
    if (req.user?.rol === 'empleado') {
      if (!req.user?.empleado_id) {
        return res.status(403).json({ error: 'Empleado no vinculado al usuario' });
      }
      // Forzar que solo vea sus propias actividades
      if (String(req.user.empleado_id) !== String(empleado_id)) {
        return res.status(403).json({ error: 'No tienes permiso para ver actividades de otros empleados' });
      }
    }

    let query = supabase
      .from('actividades')
      .select('*')
      .eq('empleado_id', empleado_id);

    if (fecha_desde) {
      query = query.gte('fecha', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha', fecha_hasta);
    }

    query = query.order('fecha', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
};

// Obtener actividad por ID
export const obtenerActividadPorId = async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Si el usuario es empleado, verificar que sea su actividad
    if (req.user?.rol === 'empleado') {
      if (!req.user?.empleado_id) {
        return res.status(403).json({ error: 'Empleado no vinculado al usuario' });
      }
      if (String(data.empleado_id) !== String(req.user.empleado_id)) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta actividad' });
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
};

// Actualizar actividad
export const actualizarActividad = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fecha, descripcion, hectareas, observaciones } = req.body;

  try {
    const { data, error } = await supabase
      .from('actividades')
      .update({ 
        fecha, 
        descripcion, 
        hectareas, 
        observaciones, 
        updatedat: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
};

// Eliminar actividad
export const eliminarActividad = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('actividades')
      .delete()
      .eq('id', id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
  }
};

// Obtener resumen de hectareas por empleado
export const obtenerResumenHectareas = async (req: Request, res: Response) => {
  const { fecha_desde, fecha_hasta } = req.query;

  try {
    let query = supabase
      .from('actividades')
      .select('empleado_id, hectareas');

    if (fecha_desde) {
      query = query.gte('fecha', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha', fecha_hasta);
    }

    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Agrupar y resumir en JavaScript
    const resumen: Record<string, any> = {};
    data?.forEach((act: any) => {
      if (!resumen[act.empleado_id]) {
        resumen[act.empleado_id] = { 
          empleado_id: act.empleado_id, 
          total_hectareas: 0, 
          total_actividades: 0 
        };
      }
      resumen[act.empleado_id].total_hectareas += act.hectareas || 0;
      resumen[act.empleado_id].total_actividades += 1;
    });

    res.json(Object.values(resumen));
  } catch (error) {
    console.error('Error al obtener resumen de hectareas:', error);
    res.status(500).json({ error: 'Error al obtener resumen de hectareas' });
  }
};

// Buscar actividades
export const buscarActividades = async (req: Request & { user?: any }, res: Response) => {
  const { search, empleado_id } = req.query;
  try {
    let query = supabase.from('actividades').select('*');
    
    // Si el usuario es empleado, SOLO puede buscar sus propias actividades (forzar filtro)
    if (req.user?.rol === 'empleado') {
      if (!req.user?.empleado_id) {
        return res.status(403).json({ error: 'Empleado no vinculado al usuario' });
      }
      query = query.eq('empleado_id', req.user.empleado_id);
    } else if (empleado_id) {
      // Admin/gerente puede filtrar por empleado_id en el buscador
      query = query.eq('empleado_id', empleado_id);
    }
    
    if (search) {
      query = query.or(`descripcion.ilike.%${search}%,observaciones.ilike.%${search}%`);
    }
    query = query.order('fecha', { ascending: false });
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) {
    console.error('Error al buscar actividades:', error);
    res.status(500).json({ error: 'Error al buscar actividades' });
  }
};
