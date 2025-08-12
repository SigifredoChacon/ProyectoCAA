import mysql from 'mysql2/promise';
import { DBConfig } from '../../DBConfig.js';

const connection = await mysql.createConnection(DBConfig);

export class valorationModel {

  // Obtener todas las valoraciones
  static async getAll() {
    const [valoraciones] = await connection.query(
      'SELECT * FROM valoracionreservas'
    );
    return valoraciones;
  }

  // Obtener una valoración por ID de encuesta
  static async getById(idEncuesta ) {
    const [valoracion] = await connection.query(
      'SELECT * FROM valoracionreservas WHERE idEncuesta = ?',
      [idEncuesta]
    );

    if (valoracion.length === 0) {
      return null;
    }

    return valoracion[0];
  }

  static async getByRoomId(idSala ) {
    const [valoracion] = await connection.query(
      'SELECT * FROM valoracionreservas WHERE idSala = ?',
      [idSala]
    );

    if (valoracion.length === 0) {
      return null;
    }

    return valoracion[0];
  }

  static async getByCubicleId(idCubiculo ) {
    const [valoracion] = await connection.query(
      'SELECT * FROM valoracionreservas WHERE idCubiculo = ?',
      [idCubiculo]
    );

    if (valoracion.length === 0) {
      return null;
    }

    return valoracion[0];
  }

  // Crear una nueva valoración
  static async create({ input }) {
    const { idSala, idCubiculo, nota, observaciones } = input;
    try {

      // Realizamos la inserción de la nueva valoración
      await connection.query(
        'INSERT INTO valoracionreservas (idSala, idCubiculo, Nota, Observaciones) VALUES (?, ?, ?, ?)',
        [idSala, idCubiculo, nota, observaciones]
      );
    } catch (error) {
      throw new Error(error);
    }

    // Recuperar la valoración insertada
    const [valoracion] = await connection.query(
      'SELECT * FROM valoracionreservas WHERE idEncuesta = LAST_INSERT_ID()'
    );

    return valoracion[0].idEncuesta;
  }

  // Eliminar una valoración por ID
  static async delete(idEncuesta) {
    try {
      await connection.query(
        'DELETE FROM valoracionreservas WHERE idEncuesta = ?',
        [idEncuesta]
      );
    } catch (error) {
      throw new Error('Error al eliminar la valoración');
    }
    return true;
  }
}
