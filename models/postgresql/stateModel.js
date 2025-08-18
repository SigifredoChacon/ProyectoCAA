import pkg from 'pg';
const { Pool } = pkg;
import {DBConfig} from '../../DBConfig.js'

const pool = new Pool(DBConfig);

export class StateModel {

    static async getAll() {
        const { rows: states } = await pool.query(
            'SELECT * FROM "estado"'
        );
        return states;
    }

  static async getByStateName({ nombre }) {
      const { rows: state } = await pool.query(
          'SELECT * FROM "estado" WHERE LOWER("Tipo") = LOWER($1)',
          [nombre]
      );

      if (state.length === 0) {
        return null;
      }

      return state[0];
  }


  static async getById({ id }) {
      const { rows: states } = await pool.query(
          'SELECT * FROM "Estado" WHERE "idEstado" = $1',
          [id]
      );

      if (states.length === 0) {
          return null;
      }

      return states[0];
  }


  static async create({ input }) {
      const { tipo } = input;
      try {
          const { rows: existing } = await pool.query(
              'SELECT "Tipo" FROM "estado" WHERE "Tipo" = $1',
              [tipo]
          );

          if (existing.length > 0) {
              return false;
          }

          const { rows: inserted } = await pool.query(
              'INSERT INTO "estado" ("Tipo") VALUES ($1) RETURNING *',
              [tipo]
          );

          return inserted[0];

      } catch (error) {
          throw new Error("Error al crear el estado");
      }
  }


  static async delete({ id }) {
    try {
      const { rows: result } = await pool.query(
        'SELECT * FROM "activo" WHERE "idEstado" = $1',
        [id]
      );

      if (result.length > 0) {
        return false;
      }

      await pool.query(
        'DELETE FROM "Estado" WHERE "idEstado" = $1',
        [id]
      );
    } catch (error) {
      throw new Error("Error al eliminar el estado");
    }

    return true;
  }


  static async update({ id, input }) {
    const { tipo } = input;

    try {
      const { rows: duplicateState } = await pool.query(
        'SELECT "Tipo" FROM "Estado" WHERE "Tipo" = $1',
        [tipo]
      );

      if (duplicateState.length > 0) {
        return false;
      }

      const { rowCount } = await pool.query(
        `UPDATE "Estado"
         SET "Tipo" = COALESCE($1, "Tipo")
         WHERE "idEstado" = $2`,
        [tipo, id]
      );

      if (rowCount === 0) {
        throw new Error('No existe un estado con esa ID');
      }

      const { rows: updatedState } = await pool.query(
        'SELECT * FROM "estado" WHERE "idEstado" = $1',
        [id]
      );

      return updatedState[0];
    } catch (error) {
      throw new Error("Error al actualizar el estado");
    }
  }


}