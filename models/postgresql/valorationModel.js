import pkg from 'pg';
const { Pool } = pkg;
import {DBConfig} from '../../DBConfig.js'

const pool = new Pool(DBConfig);

export class valorationModel {

  static async getAll() {
    try {
      const { rows: valoraciones } = await pool.query(
          'SELECT * FROM "valoracionreservas"'
      );
      return valoraciones;
    } catch (error) {
      throw new Error(error);
    }
  }


  static async getById(idEncuesta) {
    try {
      const { rows: valoracion } = await pool.query(
          'SELECT * FROM "valoracionreservas" WHERE "idEncuesta" = $1',
          [idEncuesta]
      );

      if (valoracion.length === 0) {
        return null;
      }

      return valoracion[0];
    } catch (error) {
      throw new Error(error);
    }
  }


  static async getByRoomId(idSala) {
    try {
      const { rows: valoracion } = await pool.query(
          'SELECT * FROM "valoracionreservas" WHERE "idSala" = $1',
          [idSala]
      );

      if (valoracion.length === 0) {
        return null;
      }

      return valoracion[0];
    } catch (error) {
      throw new Error(error);
    }
  }


  static async getByCubicleId(idCubiculo) {
    try {
      const { rows: valoracion } = await pool.query(
          'SELECT * FROM "valoracionreservas" WHERE "idCubiculo" = $1',
          [idCubiculo]
      );

      if (valoracion.length === 0) {
        return null;
      }

      return valoracion[0];
    } catch (error) {
      throw new Error(error);
    }
  }



  static async create({ input }) {
    const { idSala, idCubiculo, nota, observaciones } = input;
    try {
      // Insertar la nueva valoración y devolver el id generado
      const { rows } = await pool.query(
          `INSERT INTO "valoracionreservas" ("idSala", "idCubiculo", "Nota", "Observaciones") 
       VALUES ($1, $2, $3, $4) 
       RETURNING "idEncuesta";`,
          [idSala, idCubiculo, nota, observaciones]
      );

      return rows[0].idEncuesta;
    } catch (error) {
      throw new Error(error);
    }
  }


  static async delete(idEncuesta) {
    try {
      await pool.query(
          'DELETE FROM "valoracionreservas" WHERE "idEncuesta" = $1',
          [idEncuesta]
      );
    } catch (error) {
      throw new Error('Error al eliminar la valoración');
    }
    return true;
  }

}
