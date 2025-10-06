import { Request, Response } from 'express';
import pool from '../db/db';

// Crear empleado y usuario automáticamente
export const crearEmpleado = async (req: Request & { user?: any }, res: Response) => {
  const { 
    nombre, apellido, documento, telefono, email, 
    direccion, fecha_ingreso, puesto, salario, password 
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const createdBy = req.user?.id; // Usuario autenticado que crea el registro

    // Validaciones
    if (!email) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: 'El email es obligatorio para crear el usuario' 
      });
    }

    if (!password) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: 'La contraseña es obligatoria para crear el usuario' 
      });
    }

    // 1. Crear usuario en la tabla users
    const userQueryText = `
      INSERT INTO users (
        email, password, nombre, rol, activo, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id
    `;
    const nombreCompleto = `${nombre} ${apellido}`;
    const userValues = [email, password, nombreCompleto, 'empleado']; // Rol por defecto: empleado

    let userId;
    try {
      const userResult = await client.query(userQueryText, userValues);
      userId = userResult.rows[0].id;
      console.log(`✅ Usuario creado con ID: ${userId} para ${email}`);
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(400).json({ 
          success: false,
          error: 'El email ya está registrado como usuario' 
        });
      }
      throw error;
    }

    // 2. Crear empleado vinculado al usuario
    // Intentar con columnas de auditoría primero
    let empleadoResult;
    try {
      const empleadoQueryText = `
        INSERT INTO empleados (
          user_id, nombre, apellido, documento, telefono, email, 
          direccion, fecha_ingreso, puesto, salario, activo, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $11) 
        RETURNING *
      `;
      const empleadoValues = [
        userId, nombre, apellido, documento || null, 
        telefono || null, email, direccion || null, 
        fecha_ingreso, puesto || null, salario || null, createdBy
      ];
      empleadoResult = await client.query(empleadoQueryText, empleadoValues);
    } catch (error: any) {
      // Si las columnas created_by/updated_by no existen, hacer rollback y reintentar sin ellas
      if (error.code === '42703') {
        console.log('⚠️  Columnas de auditoría no existen, haciendo rollback y reintentando...');
        await client.query('ROLLBACK');
        await client.query('BEGIN');
        
        // Recrear el usuario
        const userResult = await client.query(
          `INSERT INTO users (email, password, nombre, rol, activo, createdat, updatedat) 
           VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
           RETURNING id`,
          [email, password, nombreCompleto, 'empleado']
        );
        userId = userResult.rows[0].id;
        
        // Crear empleado sin columnas de auditoría
        const empleadoQueryTextSinAuditoria = `
          INSERT INTO empleados (
            user_id, nombre, apellido, documento, telefono, email, 
            direccion, fecha_ingreso, puesto, salario, activo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) 
          RETURNING *
        `;
        const empleadoValuesSinAuditoria = [
          userId, nombre, apellido, documento || null, 
          telefono || null, email, direccion || null, 
          fecha_ingreso, puesto || null, salario || null
        ];
        empleadoResult = await client.query(empleadoQueryTextSinAuditoria, empleadoValuesSinAuditoria);
      } else {
        throw error;
      }
    }

    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Empleado y usuario creados correctamente',
      data: {
        empleado: empleadoResult.rows[0],
        usuario: {
          id: userId,
          email: email,
          nombre: nombreCompleto,
          rol: 'empleado'
        }
      }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error al crear empleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false,
        error: 'El documento ya está registrado' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Error al crear empleado y usuario' 
    });
  } finally {
    client.release();
  }
};

// Obtener todos los empleados
export const obtenerEmpleados = async (req: Request, res: Response) => {
  try {
    const { activo } = req.query;
    let query = 'SELECT * FROM Empleados';
    const params: any[] = [];

    if (activo !== undefined) {
      query += ' WHERE activo = $1';
      params.push(activo === 'true');
    }

    query += ' ORDER BY apellido, nombre';

    const result = await pool.query(query, params);
    res.json({ 
      success: true, 
      empleados: result.rows 
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener empleados' 
    });
  }
};

// Obtener empleado por ID
export const obtenerEmpleadoPorId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM Empleados WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json(result.rows[0]);
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
    const updatedBy = req.user?.id; // Usuario autenticado que actualiza el registro

    let result;
    try {
      // Intentar con columna de auditoría
      const queryText = `
        UPDATE empleados 
        SET nombre = $1, apellido = $2, documento = $3, telefono = $4, 
            email = $5, direccion = $6, fecha_ingreso = $7, puesto = $8, 
            salario = $9, activo = $10, updated_by = $11, updatedat = CURRENT_TIMESTAMP
        WHERE id = $12 
        RETURNING *
      `;
      const values = [
        nombre, apellido, documento, telefono, email, 
        direccion, fecha_ingreso, puesto, salario, activo, updatedBy, id
      ];
      result = await pool.query(queryText, values);
    } catch (error: any) {
      // Si la columna updated_by no existe, actualizar sin ella
      if (error.code === '42703') {
        console.log('⚠️  Columna updated_by no existe, actualizando sin ella...');
        const queryTextSinAuditoria = `
          UPDATE empleados 
          SET nombre = $1, apellido = $2, documento = $3, telefono = $4, 
              email = $5, direccion = $6, fecha_ingreso = $7, puesto = $8, 
              salario = $9, activo = $10, updatedat = CURRENT_TIMESTAMP
          WHERE id = $11 
          RETURNING *
        `;
        const valuesSinAuditoria = [
          nombre, apellido, documento, telefono, email, 
          direccion, fecha_ingreso, puesto, salario, activo, id
        ];
        result = await pool.query(queryTextSinAuditoria, valuesSinAuditoria);
      } else {
        throw error;
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Empleado no encontrado' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error al actualizar empleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false,
        error: 'El documento ya está registrado' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar empleado' 
    });
  }
};

// Eliminar empleado (soft delete)
export const eliminarEmpleado = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE Empleados SET activo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
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
    const queryText = `
      SELECT * FROM Empleados 
      WHERE (nombre ILIKE $1 OR apellido ILIKE $1 OR documento ILIKE $1)
      AND activo = true
      ORDER BY apellido, nombre
    `;
    const result = await pool.query(queryText, [`%${search}%`]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al buscar empleados:', error);
    res.status(500).json({ error: 'Error al buscar empleados' });
  }
};
