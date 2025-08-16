import pkg from 'pg';
const { Pool } = pkg;

import { DBConfig } from '../../DBConfig.js'

const pool = new Pool(DBConfig);

export class resourceModel {

    static async getAll() {
        const { rows: resources } = await pool.query(
            'SELECT * FROM recursos'
        );
        return resources;
    }

    static async getById({ id }) {
        const { rows: resource } = await pool.query(
            'SELECT * FROM recursos WHERE "idRecursos" = $1',
            [id]
        );

        if (resource.length === 0) {
            return null;
        }

        return resource[0];
    }

    static async create({ input }) {
        const { nombre } = input;

        try {
            const { rows: result } = await pool.query(
                'SELECT "Nombre" FROM recursos WHERE "Nombre" = $1',
                [nombre]
            );

            if (result.length > 0) {
                return false;
            }

            const { rows: inserted } = await pool.query(
                'INSERT INTO recursos ("Nombre") VALUES ($1) RETURNING *',
                [nombre]
            );

            return inserted[0];
        } catch (error) {
            throw new Error("Error al crear el recurso");
        }
    }

    static async delete({ id }) {
        try {
            const { rows: result } = await pool.query(
                'SELECT * FROM reservacion_recursos WHERE "idRecurso" = $1',
                [id]
            );

            if (result.length > 0) {
                return false;
            }

            await pool.query(
                'DELETE FROM recursos WHERE "idRecursos" = $1',
                [id]
            );
        } catch (error) {
            throw new Error("Error al eliminar el recurso");
        }
        return true;
    }

    static async update({ id, input }) {
        const { nombre } = input;

        try {
            const { rows: duplicate } = await pool.query(
                'SELECT "Nombre" FROM recursos WHERE "Nombre" = $1',
                [nombre]
            );
            if (duplicate.length > 0) {
                return false;
            }

            const { rowCount } = await pool.query(
                `UPDATE recursos
                 SET "Nombre" = COALESCE($1, "Nombre")
                 WHERE "idRecursos" = $2;`,
                [nombre, id]
            );
            if (rowCount === 0) {
                throw new Error('No se encontro el recurso con ese id');
            }

            const { rows: updatedResource } = await pool.query(
                `SELECT *
                 FROM recursos WHERE "idRecursos" = $1;`,
                [id]
            );

            return updatedResource[0];
        } catch (error) {
            throw new Error("Error al actualizar el recurso");
        }
    }

}