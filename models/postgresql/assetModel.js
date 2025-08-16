import pkg from 'pg';
const { Pool } = pkg;
import {DBConfig} from '../../DBConfig.js'


const pool = new Pool(DBConfig);

export class assetModel {

    static async getAll () {
        const { rows: assets } = await pool.query(`
            SELECT
                a."NumeroPlaca",
                a."Nombre",
                a."Descripcion",
                a."Modelo",
                a."NumeroSerie",
                a."Marca",
                a."Condicion",
                e."Tipo" AS "NombreEstado",
                e."idEstado" AS "idEstado",
                c."Nombre" AS "NombreCategoria",
                c."idCategoria" AS "idCategoria"
            FROM
                "activo" a
                    JOIN
                "estado" e ON a."idEstado" = e."idEstado"
                    JOIN
                "categoria" c ON a."idCategoria" = c."idCategoria";
        `);

        return assets;
    }

    static async getById ({ id }) {
        const { rows: asset } = await pool.query(
            'SELECT * FROM "activo" WHERE "NumeroPlaca" = $1',
            [id]
        );

        if (asset.length === 0) {
            return null;
        }

        return asset[0];
    }

    static async getByCategory ({ id }) {
        const { rows: assets } = await pool.query(
            'SELECT * FROM "activo" WHERE "idCategoria" = $1',
            [id]
        );

        if (assets.length === 0) {
            return null;
        }

        return assets;
    }


    static async getFirstAvailableAsset ({ assetCategory }) {

        const { rows: categoryId } = await pool.query(
            'SELECT "idCategoria" FROM "categoria" WHERE LOWER("Nombre") = $1',
            [assetCategory.toLowerCase()]
        );

        if (categoryId.length === 0) {
            return null;
        }


        const { rows: asset } = await pool.query(
            `SELECT
                 a."NumeroPlaca",
                 a."Nombre",
                 a."Descripcion",
                 a."Modelo",
                 a."NumeroSerie",
                 a."Marca",
                 e."Tipo" AS "NombreEstado"
             FROM
                 "activo" a
                     JOIN
                 "estado" e ON a."idEstado" = e."idEstado"
                     JOIN
                 "categoria" c ON a."idCategoria" = c."idCategoria"
             WHERE
                 a."idCategoria" = $1 AND a."Condicion" = 0
                 LIMIT 1`,
            [categoryId[0].idCategoria]
        );

        if (asset.length === 0) {
            return null;
        }

        return asset[0];
    }


    static async create ({ input }) {
        const {
            numeroPlaca,
            nombre,
            descripcion,
            modelo,
            numeroSerie,
            marca,
            idEstado,
            condicion,
            idCategoria
        } = input;

        try {
            // Verificar si ya existe ese NumeroPlaca
            const { rows: resultPlaca } = await pool.query(
                'SELECT "NumeroPlaca" FROM "activo" WHERE "NumeroPlaca" = $1',
                [numeroPlaca]
            );

            if (resultPlaca.length > 0) {
                throw new Error('Activo existente con ese numero de placa');
            }

            // Verificar si ya existe ese NumeroSerie
            const { rows: resultSerie } = await pool.query(
                'SELECT "NumeroSerie" FROM "activo" WHERE "NumeroSerie" = $1',
                [numeroSerie]
            );

            if (resultSerie.length > 0) {
                throw new Error('Activo existente con ese numero de serie');
            }

            // Verificar si existe el estado
            const { rows: resultEstado } = await pool.query(
                'SELECT "idEstado" FROM "estado" WHERE "idEstado" = $1',
                [idEstado]
            );

            if (resultEstado.length <= 0) {
                return false;
            }

            // Verificar si existe la categoría
            const { rows: resultCategoria } = await pool.query(
                'SELECT "idCategoria" FROM "categoria" WHERE "idCategoria" = $1',
                [idCategoria]
            );

            if (resultCategoria.length <= 0) {
                return false;
            }

            // Insertar el nuevo activo
            await pool.query(
                `INSERT INTO "activo" 
                ("NumeroPlaca","Nombre","Descripcion","Modelo","NumeroSerie","Marca","idEstado","Condicion","idCategoria") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [numeroPlaca, nombre, descripcion, modelo, numeroSerie, marca, idEstado, condicion, idCategoria]
            );
        } catch (error) {
            return error.message;
        }

        // Devolver el activo recién insertado
        const { rows: asset } = await pool.query(
            'SELECT * FROM "activo" WHERE "NumeroPlaca" = $1',
            [numeroPlaca]
        );

        return asset[0];
    }


    static async delete ({ id }) {
        try {
            // Verificar si hay solicitudes relacionadas
            const { rows: result } = await pool.query(
                'SELECT * FROM "solicitud" WHERE "idActivo" = $1',
                [id]
            );

            if (result.length > 0) {
                return false;
            }

            // Eliminar el activo
            await pool.query(
                'DELETE FROM "activo" WHERE "NumeroPlaca" = $1',
                [id]
            );
        } catch (error) {
            throw new Error("Error al eliminar el activo");
        }

        return true;
    }


    static async update({ id, input }) {
        const {
            nombre,
            descripcion,
            modelo,
            marca,
            numeroSerie,
            idEstado,
            condicion,
            idCategoria
        } = input;

        try {
            if (idEstado != null) {
                const { rows: existEstado } = await pool.query(
                    'SELECT "idEstado" FROM "estado" WHERE "idEstado" = $1',
                    [idEstado]
                );

                if (existEstado.length <= 0) {
                    return false;
                }
            }

            const { rowCount } = await pool.query(
                `UPDATE "activo"
                 SET "Nombre" = COALESCE($1, "Nombre"),
                     "Descripcion" = COALESCE($2, "Descripcion"),
                     "Modelo" = COALESCE($3, "Modelo"),
                     "Marca" = COALESCE($4, "Marca"),
                     "NumeroSerie" = COALESCE($5, "NumeroSerie"),
                     "idEstado" = COALESCE($6, "idEstado"),
                     "Condicion" = COALESCE($7, "Condicion"),
                     "idCategoria" = COALESCE($8, "idCategoria")
                 WHERE "NumeroPlaca" = $9;`,
                [nombre, descripcion, modelo, marca, numeroSerie, idEstado, condicion, idCategoria, id]
            );

            if (rowCount === 0) {
                throw new Error('No se encontro activo con ese id');
            }

            const { rows: updatedAsset } = await pool.query(
                'SELECT * FROM "activo" WHERE "NumeroPlaca" = $1;',
                [id]
            );

            return updatedAsset[0];
        } catch (error) {
            throw new Error("Error al actualizar el activo");
        }
    }


}