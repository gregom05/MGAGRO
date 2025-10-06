import { Request, Response } from 'express';
import pool from '../db/db';

// Crear o actualizar facelectronica
export const upsertFacElectronica = async (req: Request, res: Response) => {
  const { nombre_empresa, nombre_bd, habilitada } = req.body;
  try {
    // Buscar la empresa por nombre_empresa
    const empresaResult = await pool.query(
      'SELECT id FROM Empresa WHERE nombre_empresa ILIKE $1',
      [nombre_empresa]
    );
    if (empresaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    const empresa_id = empresaResult.rows[0].id;

    // Buscar la base de datos por nombre_bd y empresa_id
    const baseResult = await pool.query(
      'SELECT id FROM BaseDatos WHERE nombre_bd ILIKE $1 AND empresa_id = $2',
      [nombre_bd, empresa_id]
    );
    if (baseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Base de datos no encontrada para esa empresa' });
    }
    const basedatos_id = baseResult.rows[0].id;

    let result;
    let queryText = '';
    let queryValues: any[] = [];
    if (habilitada) {
  queryText = `INSERT INTO FacElectronica (empresa_id, basedatos_id, habilitada, fecha_alta, fecha_baja)
     VALUES ($1, $2, true, NOW(), NULL)
     ON CONFLICT (empresa_id, basedatos_id)
     DO UPDATE SET habilitada = true, fecha_alta = NOW(), fecha_baja = NULL
     RETURNING *`;
      queryValues = [empresa_id, basedatos_id];
    } else {
  queryText = `UPDATE FacElectronica SET habilitada = false, fecha_baja = NOW() WHERE empresa_id = $1 AND basedatos_id = $2 RETURNING *`;
      queryValues = [empresa_id, basedatos_id];
    }
    // Mostrar la query real para debug
    let debugQuery = queryText;
    queryValues.forEach((val, idx) => {
      debugQuery = debugQuery.replace(`$${idx + 1}`, `'${val}'`);
    });
    console.log('Query real:', debugQuery);
    result = await pool.query(queryText, queryValues);
    res.json(result.rows[0]);
  } catch (error) {
  res.status(500).json({ error: 'Error al guardar facelectronica' });
  }
};

// Buscar facelectronica
export const buscarFacElectronica = async (req: Request, res: Response) => {
  const { nombre_empresa, rut, nombre_bd, n_sistema, n_instalacion } = req.query;
  try {
  let query = `SELECT f.*, e.nombre_empresa, e.rut, e.n_sistema, e.n_instalacion, b.nombre_bd
         FROM FacElectronica f
         JOIN Empresa e ON f.empresa_id = e.id
         JOIN BaseDatos b ON f.basedatos_id = b.id
         WHERE 1=1`;
    const params: any[] = [];
    if (nombre_empresa) {
      query += ' AND e.nombre_empresa ILIKE $' + (params.length + 1);
      params.push(nombre_empresa);
    }
    if (rut) {
      query += ' AND e.rut = $' + (params.length + 1);
      params.push(rut);
    }
    if (nombre_bd) {
      query += ' AND b.nombre_bd ILIKE $' + (params.length + 1);
      params.push(nombre_bd);
    }
    if (n_sistema) {
      query += ' AND e.n_sistema = $' + (params.length + 1);
      params.push(n_sistema);
    }
    if (n_instalacion) {
      query += ' AND e.n_instalacion = $' + (params.length + 1);
      params.push(n_instalacion);
    }
    // Mostrar la query real para debug
    let debugQuery = query;
    params.forEach((val, idx) => {
      debugQuery = debugQuery.replace(`$${idx + 1}`, `'${val}'`);
    });
    console.log('Query real:', debugQuery);
    const result = await pool.query(query, params);

    // Ejecutar la consulta secundaria siempre, pero filtrar duplicados
    let secundarios: any[] = [];
    if (nombre_empresa || rut || n_sistema || n_instalacion) {
      let empresaQuery = 'SELECT id, nombre_empresa, rut, n_sistema, n_instalacion FROM Empresa WHERE 1=1';
      const empresaParams: any[] = [];
      if (nombre_empresa) {
        empresaQuery += ' AND nombre_empresa ILIKE $' + (empresaParams.length + 1);
        empresaParams.push(nombre_empresa);
      }
      if (rut) {
        empresaQuery += ' AND rut = $' + (empresaParams.length + 1);
        empresaParams.push(rut);
      }
      if (n_sistema) {
        empresaQuery += ' AND n_sistema = $' + (empresaParams.length + 1);
        empresaParams.push(n_sistema);
      }
      if (n_instalacion) {
        empresaQuery += ' AND n_instalacion = $' + (empresaParams.length + 1);
        empresaParams.push(n_instalacion);
      }
      let debugEmpresaQuery = empresaQuery;
      empresaParams.forEach((val, idx) => {
        debugEmpresaQuery = debugEmpresaQuery.replace(`$${idx + 1}`, `'${val}'`);
      });
      console.log('Query secundaria Empresa:', debugEmpresaQuery);

      const empresas = await pool.query(empresaQuery, empresaParams);
      if (empresas.rows.length > 0) {
        const basesQuery = 'SELECT * FROM BaseDatos WHERE empresa_id = $1';
        console.log('Query secundaria BaseDatos:', basesQuery.replace('$1', `'${empresas.rows[0].id}'`));
        const bases = await pool.query(basesQuery, [empresas.rows[0].id]);
        secundarios = bases.rows.map((b: any) => ({
          nombre_empresa: empresas.rows[0].nombre_empresa,
          rut: empresas.rows[0].rut,
          n_sistema: empresas.rows[0].n_sistema,
          n_instalacion: empresas.rows[0].n_instalacion,
          nombre_bd: b.nombre_bd,
          habilitada: false
        }));
      }
    }
    if (nombre_bd) {
      const baseQuery = 'SELECT * FROM BaseDatos WHERE nombre_bd ILIKE $1';
      console.log('Query secundaria BaseDatos:', baseQuery.replace('$1', `'${nombre_bd}'`));
      const base = await pool.query(baseQuery, [nombre_bd]);
      if (base.rows.length > 0) {
        const empresaQuery = 'SELECT * FROM Empresa WHERE id = $1';
        console.log('Query secundaria Empresa:', empresaQuery.replace('$1', `'${base.rows[0].empresa_id}'`));
        const empresa = await pool.query(empresaQuery, [base.rows[0].empresa_id]);
        if (empresa.rows.length > 0) {
          secundarios.push({
            nombre_empresa: empresa.rows[0].nombre_empresa,
            rut: empresa.rows[0].rut,
            n_sistema: empresa.rows[0].n_sistema,
            n_instalacion: empresa.rows[0].n_instalacion,
            nombre_bd: base.rows[0].nombre_bd,
            habilitada: false
          });
        }
      }
    }
    // Filtrar duplicados por nombre_empresa, rut, n_sistema, n_instalacion y nombre_bd
    const todos = [...result.rows, ...secundarios];
    const unique = todos.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.nombre_empresa === item.nombre_empresa &&
        t.rut === item.rut &&
        t.n_sistema === item.n_sistema &&
        t.n_instalacion === item.n_instalacion &&
        t.nombre_bd === item.nombre_bd
      ))
    );
    res.json(unique);
  } catch (error) {
  res.status(500).json({ error: 'Error al buscar facelectronica' });
  }
};
