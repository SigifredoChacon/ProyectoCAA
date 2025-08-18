import pkg from 'pg';
const { Pool } = pkg;
import { DBConfig } from '../../DBConfig.js'

const pool = new Pool(DBConfig);

export class roleModel {

    static async getAll() {
        const { rows: roles } = await pool.query(
            'SELECT * FROM "rol"'
        );
        return roles;
    }

    static async getById({ id }) {
        const { rows: roles } = await pool.query(
            'SELECT * FROM "rol" WHERE "idRol" = $1',
            [id]
        );

        if (roles.length === 0) {
            return null;
        }

        return roles[0];
    }


    static async create({ input }) {
        const { nombre } = input;

        try {
            const { rows: existingRoles } = await pool.query(
                'SELECT "Nombre" FROM "rol" WHERE "Nombre" = $1',
                [nombre]
            );

            if (existingRoles.length > 0) {
                return false;
            }

            const { rows } = await pool.query(
                'INSERT INTO "rol" ("Nombre") VALUES ($1) RETURNING *',
                [nombre]
            );

            return rows[0];
        } catch (error) {
            throw new Error("Error al crear el rol");
        }
    }


    static async delete({ id }) {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM "usuario" WHERE "idRol" = $1',
                [id]
            );

            if (rows.length > 0) {
                return false;
            }

            await pool.query(
                'DELETE FROM "rol" WHERE "idRol" = $1',
                [id]
            );

            return true;
        } catch (error) {
            throw new Error("Error al eliminar el rol");
        }
    }


    static async update({ id, input }) {
        const { nombre } = input;

        try {
            // Verificar duplicado
            const { rows: duplicate } = await pool.query(
                'SELECT "Nombre" FROM "rol" WHERE "Nombre" = $1',
                [nombre]
            );

            if (duplicate.length > 0) {
                return false;
            }

            // Actualizar el rol
            const { rowCount } = await pool.query(
                `UPDATE "rol"
                 SET "Nombre" = COALESCE($1, "Nombre")
                 WHERE "idRol" = $2`,
                [nombre, id]
            );

            if (rowCount === 0) {
                throw new Error('No se encontró el rol con ese id');
            }

            // Obtener el rol actualizado
            const { rows: updatedRole } = await pool.query(
                'SELECT * FROM rol WHERE idRol = $1',
                [id]
            );

            return updatedRole[0];

        } catch (error) {
            throw new Error("Error al actualizar el rol");
        }
    }


    static async getByRoleName({ nombre }) {
        const { rows: role } = await pool.query(
            'SELECT * FROM rol WHERE LOWER("Nombre") = LOWER($1)',
            [nombre]
        );

        if (role.length === 0) {
            return null;
        }

        return role[0];
    }


}