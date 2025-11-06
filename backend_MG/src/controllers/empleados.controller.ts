import { Request, Response } from 'express';
import supabase from '../db/db';

// Crear empleado y usuario automáticamente
export const crearEmpleado = async (req: Request & { user?: any }, res: Response) => {
  const { 
    nombre, apellido, documento, telefono, email, 
    direccion, fecha_ingreso, puesto, salario, password 
  } = req.body;

  // Supabase does not support multi-statement transactions
  try {
    const createdBy = req.user?.id;
    if (!email) {
      return res.status(400).json({ success: false, error: 'El email es obligatorio para crear el usuario' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'La contraseña es obligatoria para crear el usuario' });
    }
    // 1. Crear usuario en la tabla users
    const nombreCompleto = `${nombre} ${apellido}`;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password,
          nombre: nombreCompleto,
          rol: 'empleado',
          activo: true,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }
      ])
      .select('id');
    if (userError) {
      if (userError.code === '23505') {
        return res.status(400).json({ success: false, error: 'El email ya está registrado como usuario' });
      }
      throw userError;
    }
    const userId = userData && userData.length > 0 ? userData[0].id : null;
    if (!userId) {
      return res.status(500).json({ success: false, error: 'No se pudo crear el usuario' });
    }
    // 2. Crear empleado vinculado al usuario
  const empleadoInsert: any = {
      user_id: userId,
      nombre,
      apellido,
      documento: documento || null,
      telefono: telefono || null,
      email,
      direccion: direccion || null,
      fecha_ingreso,
      puesto: puesto || null,
      salario: salario || null,
      activo: true
    };
    if (createdBy) {
      empleadoInsert['created_by'] = createdBy;
      empleadoInsert['updated_by'] = createdBy;
    }
    const { data: empleadoData, error: empleadoError } = await supabase
      .from('empleados')
      .insert([empleadoInsert])
      .select();
    if (empleadoError) {
      if (empleadoError.code === '42703') {
        // Si las columnas de auditoría no existen, reintentar sin ellas
        const { data: empleadoDataSinAuditoria, error: empleadoErrorSinAuditoria } = await supabase
          .from('empleados')
          .insert([
            {
              user_id: userId,
              nombre,
              apellido,
              documento: documento || null,
              telefono: telefono || null,
              email,
              direccion: direccion || null,
              fecha_ingreso,
              puesto: puesto || null,
              salario: salario || null,
              activo: true
            }
          ])
          .select();
        if (empleadoErrorSinAuditoria) throw empleadoErrorSinAuditoria;
        res.status(201).json({
          success: true,
          message: 'Empleado y usuario creados correctamente',
          data: {
            empleado: empleadoDataSinAuditoria && empleadoDataSinAuditoria.length > 0 ? empleadoDataSinAuditoria[0] : null,
            usuario: {
              id: userId,
              email,
              nombre: nombreCompleto,
              rol: 'empleado'
            }
          }
        });
        return;
      }
      throw empleadoError;
    }
    res.status(201).json({
      success: true,
      message: 'Empleado y usuario creados correctamente',
      data: {
        empleado: empleadoData && empleadoData.length > 0 ? empleadoData[0] : null,
        usuario: {
          id: userId,
          email,
          nombre: nombreCompleto,
          rol: 'empleado'
        }
      }
    });
  } catch (error: any) {
    console.error('Error al crear empleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'El documento ya está registrado' });
    }
    res.status(500).json({ success: false, error: 'Error al crear empleado y usuario' });
  }
};
// Obtener todos los empleados
export const obtenerEmpleados = async (req: Request, res: Response) => {
  try {
    const { activo } = req.query;
    let query = supabase.from('empleados').select('*');
    if (activo !== undefined) {
      query = query.eq('activo', activo === 'true');
    }
    query = query.order('apellido', { ascending: true }).order('nombre', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, empleados: data });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ success: false, error: 'Error al obtener empleados' });
  }
};

// Obtener empleado por ID
export const obtenerEmpleadoPorId = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

// Actualizar empleado
export const actualizarEmpleado = async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const { 
    nombre, apellido, documento, telefono, email, 
    direccion, fecha_ingreso, puesto, salario, activo 
  } = req.body;
  try {
    const updatedBy = req.user?.id;
    let updateObj: any = {
      nombre,
      apellido,
      documento,
      telefono,
      email,
      direccion,
      fecha_ingreso,
      puesto,
      salario,
      activo
    };
    if (updatedBy) {
      updateObj.updated_by = updatedBy;
      updateObj.updatedat = new Date().toISOString();
    } else {
      updateObj.updatedat = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('empleados')
      .update(updateObj)
      .eq('id', id)
      .select();
    if (error) {
      if (error.code === '42703') {
        // Si la columna updated_by no existe, actualizar sin ella
        const { data: dataSinAuditoria, error: errorSinAuditoria } = await supabase
          .from('empleados')
          .update({
            nombre,
            apellido,
            documento,
            telefono,
            email,
            direccion,
            fecha_ingreso,
            puesto,
            salario,
            activo,
            updatedat: new Date().toISOString()
          })
          .eq('id', id)
          .select();
        if (errorSinAuditoria) throw errorSinAuditoria;
        if (!dataSinAuditoria || dataSinAuditoria.length === 0) {
          return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
        }
        res.json({ success: true, data: dataSinAuditoria[0] });
        return;
      }
      throw error;
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
    }
    res.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error('Error al actualizar empleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'El documento ya está registrado' });
    }
    res.status(500).json({ success: false, error: 'Error al actualizar empleado' });
  }
};

// Eliminar empleado (soft delete)
export const eliminarEmpleado = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('empleados')
      .update({ activo: false })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json({ message: 'Empleado desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};

// Buscar empleados
export const buscarEmpleados = async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,documento.ilike.%${search}%`)
      .eq('activo', true)
      .order('apellido', { ascending: true })
      .order('nombre', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al buscar empleados:', error);
    res.status(500).json({ error: 'Error al buscar empleados' });
  }
};
