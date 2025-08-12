import mysql from 'mysql2/promise'
import {DBConfig} from '../../DBConfig.js'


const connection = await mysql.createConnection(DBConfig)

export class assetModel {

    static async getAll () {
        const [assets] = await connection.query(
            `SELECT 
        a.NumeroPlaca,
        a.Nombre,
        a.Descripcion,
        a.Modelo,
        a.NumeroSerie,
        a.Marca,
        a.Condicion,
        e.Tipo AS NombreEstado,
        e.idEstado AS idEstado,
        c.Nombre AS NombreCategoria,
        c.idCategoria AS idCategoria
        FROM 
            activo a
        JOIN 
            estado e ON a.idEstado = e.idEstado
        JOIN
            categoria c on a.idCategoria = c.idCategoria;`,
        )
        return assets
    }

    static async getById ({ id }) {
        const [asset] = await connection.query(
            'SELECT * FROM activo WHERE NumeroPlaca = ?',
            [id]
        )
        if(asset.length === 0) {
            return null
        }

        return asset[0]
    }
    static async getByCategory ({ id }) {
        const [assets] = await connection.query(
            'SELECT * FROM activo WHERE idCategoria = ?',
            [id]
        )
        if(assets.length === 0) {
            return null
        }
        return assets
    }

    static async getFirstAvailableAsset ({ assetCategory }) {

        const [categoryId] = await connection.query(
          'SELECT idCategoria FROM categoria where LOWER(Nombre) = ?',
          [assetCategory.toLowerCase()])

        if(categoryId.length === 0) {
          return null
        }

        const [asset] = await connection.query(
          `SELECT 
            a.NumeroPlaca,
            a.Nombre,
            a.Descripcion,
            a.Modelo,
            a.NumeroSerie,
            a.Marca,
            e.Tipo AS NombreEstado
          FROM 
            activo a
          JOIN 
            estado e ON a.idEstado = e.idEstado
          JOIN
            categoria c on a.idCategoria = c.idCategoria
          WHERE 
            a.idCategoria = ? AND a.Condicion = 0
          LIMIT 1`,
          [categoryId[0].idCategoria]
        )

        if(asset.length === 0) {
            return null
        }
        return asset[0]

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
        } = input
        try {

            const [resultPlaca] = await connection.query(
                'SELECT numeroPlaca FROM activo WHERE NumeroPlaca = ?',
                [numeroPlaca]
            )

            if (resultPlaca.length > 0) {
                throw new Error('Activo existente con ese numero de placa');
            }
            const [resultSerie] = await connection.query(
                'SELECT numeroSerie FROM activo WHERE NumeroSerie = ?',
                [numeroSerie]
            )

            if (resultSerie.length > 0) {
                throw new Error('Activo existente con ese numero de serie');
            }


            const [resultEstado] = await connection.query(
                'SELECT idEstado FROM estado WHERE idEstado = ?',
                [idEstado]
            )
            if(resultEstado.length <= 0) {
                return false
            }


            const [resultCategoria] = await connection.query(
                'SELECT idCategoria FROM categoria WHERE idCategoria = ?',
                [idCategoria]
            )
            if(resultCategoria.length <= 0) {
                return false
            }


            await connection.query(
                'INSERT INTO activo (NumeroPlaca,Nombre,Descripcion,Modelo,NumeroSerie,Marca,idEstado,Condicion,idCategoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [numeroPlaca, nombre, descripcion, modelo, numeroSerie, marca, idEstado, condicion, idCategoria]
            )
        }
        catch (error) {
            return error.message;
        }

        const [asset] = await connection.query(
            `SELECT *
             FROM activo WHERE NumeroPlaca = ?;`,
            [numeroPlaca]
        )
        return asset[0]
    }

    static async delete ({ id }) {
        try {
            const [result] = await connection.query(
                'SELECT * FROM solicitud WHERE idActivo = ?',
                [id]
            )
            if (result.length > 0) {
                return false
            }
            await connection.query(
                'DELETE FROM activo WHERE NumeroPlaca = ?',
                [id]
            )
        }
        catch (error) {
            throw new Error("Error al eliminar el activo")
        }
        return true
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
        } = input

        try {
            console.log(idEstado)

            if(idEstado != null){

                const [existEstado] = await connection.query(
                    'SELECT idEstado FROM estado WHERE idEstado = ?',
                    [idEstado]
                )


                if(existEstado.length <= 0) {
                    return false
                }
            }

            const [result] = await connection.query(
                `UPDATE activo
       SET Nombre = COALESCE(?, Nombre),
           Descripcion = COALESCE(?, Descripcion),
           Modelo = COALESCE(?, Modelo),
           Marca = COALESCE(?, Marca),
           NumeroSerie = COALESCE(?, NumeroSerie),
           idEstado = COALESCE(?, idEstado),
           Condicion = COALESCE(?, Condicion),
           idCategoria = COALESCE(?, idCategoria)
       WHERE NumeroPlaca = ?;`,
                [nombre, descripcion, modelo, marca, numeroSerie, idEstado, condicion, idCategoria, id]
            );
            if (result.affectedRows === 0) {
                throw new Error('No se encontro activo con ese id');
            }

            const [updatedAsset] = await connection.query(
                `SELECT *
                    FROM activo WHERE NumeroPlaca = ?;`,
                [id]
            );

            return updatedAsset[0];
        } catch (error) {
            throw new Error("Error al actualizar el activo");
        }
    }

}