import mysql from 'mysql2/promise'
import {DBConfig} from '../../DBConfig.js'

const connection = await mysql.createConnection(DBConfig)

export class StateModel {

  static async getAll () {
    const [states] = await connection.query(
      'SELECT * FROM estado',
    )
    return states
  }

  static async getByStateName({ nombre }) {
    const [state] = await connection.query(
        'SELECT * FROM estado WHERE LOWER(Tipo) = LOWER(?)',
        [nombre]
    );

    if (state.length === 0) {
      return null;
    }

    return state[0];
  }

  static async getById ({ id }) {
    const [states] = await connection.query(
      'SELECT * FROM Estado WHERE idEstado = ?',
      [id]
    )
    if(states.length === 0) {
      return null
    }

    return states[0]
  }

  static async create ({ input }) {
    const {
      tipo
    } = input
    try {

      const [result] = await connection.query(
        'SELECT Tipo FROM estado WHERE Tipo = ?',
        [tipo]
      )

      if (result.length > 0) {
        return false
      }

      await connection.query(
        'INSERT INTO estado (Tipo) VALUES (?)',
        [tipo]
      )
    }
    catch (error) {
      throw new Error("Error al crear el estado")
    }

    const [state] = await connection.query(
      `SELECT *
             FROM Estado WHERE idEstado = LAST_INSERT_ID();`
    )
    return state[0]
  }

  static async delete ({ id }) {
    try {
      const [result] = await connection.query(
        'SELECT * FROM activo WHERE idEstado = ?',
        [id]
      )
      if (result.length > 0) {
        return false
      }
      await connection.query(
        'DELETE FROM Estado WHERE idEstado = ?',
        [id]
      )
    }
    catch (error) {
      throw new Error("Error al eliminar el estado")
    }
    return true
  }

  static async update({ id, input }) {
    const {
      tipo
    } = input

    try {

      const [duplicateState] = await connection.query(
        'SELECT Tipo FROM Estado WHERE Tipo = ?',
        [tipo]
      )
      if (duplicateState.length > 0) {
        return false
      }

      const [result] = await connection.query(
        `UPDATE Estado
       SET Tipo = COALESCE(?, Tipo)
       WHERE idEstado = ?;`,
        [tipo, id]

      );
      if (result.affectedRows === 0) {
        throw new Error('No existe un estado con esa ID');
      }

      const [updatedState] = await connection.query(
        `SELECT *
                    FROM estado WHERE idEstado = ?;`,
        [id]
      );

      return updatedState[0];
    } catch (error) {
      throw new Error("Error al actualizar el estado");
    }
  }

}