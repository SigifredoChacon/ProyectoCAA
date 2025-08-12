import mysql from 'mysql2/promise'



import { DBConfig } from '../../DBConfig.js'

const connection = await mysql.createConnection(DBConfig)

export class roleModel {

    static async getAll () {
        const [roles] = await connection.query(
            'SELECT * FROM rol',
        )
        return roles
    }

    static async getById ({ id }) {
        const [role] = await connection.query(
            'SELECT * FROM rol WHERE idRol = ?',
            [id]
        )
        if(role.length === 0) {
            return null
        }

        return role[0]
    }

    static async create ({ input }) {
        const {
            nombre,
        } = input
        try {

            const [result] = await connection.query(
                'SELECT nombre FROM rol WHERE Nombre = ?',
                [nombre]
            )

            if (result.length > 0) {
                return false
            }

            await connection.query(
                'INSERT INTO rol (Nombre) VALUES (?)',
                [nombre]
            )
        }
        catch (error) {
            throw new Error("Error al crear el rol")
        }

        const [role] = await connection.query(
            `SELECT *
             FROM rol WHERE idRol = LAST_INSERT_ID();`
        )
        return role[0]
    }

    static async delete ({ id }) {
        try {
            const [result] = await connection.query(
                'SELECT * FROM usuario WHERE idRol = ?',
                [id]
            )

            if(result.length>0){
                return false
            }

            await connection.query(
                'DELETE FROM rol WHERE idRol = ?',
                [id]
            )
        }
        catch (error) {
            throw new Error("Error al eliminar el rol")
        }
        return true
    }

    static async update({ id, input }) {
        const {
            nombre
        } = input

        try {

            const [duplicate] = await connection.query(
                'SELECT nombre FROM rol WHERE Nombre = ?',
                [nombre]
            )
            if (duplicate.length > 0) {
                return false
            }

            const [result] = await connection.query(
                `UPDATE rol
       SET Nombre = COALESCE(?, Nombre)
       WHERE idRol = ?;`,
                [nombre, id]
            );
            if (result.affectedRows === 0) {
                throw new Error('No se encontro el rol con ese id');
            }

            const [updatedRole] = await connection.query(
                `SELECT *
                    FROM rol WHERE idRol = ?;`,
                [id]
            );

            return updatedRole[0];
        } catch (error) {
            throw new Error("Error al actualizar el Rol");
        }
    }

    static async getByRoleName({ nombre }) {
        const [role] = await connection.query(
          'SELECT * FROM rol WHERE LOWER(Nombre) = LOWER(?)',
          [nombre]
        );

        if (role.length === 0) {
            return null;
        }

        return role[0];
    }

}