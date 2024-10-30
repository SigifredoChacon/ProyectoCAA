import mysql from 'mysql2/promise'
import {DBConfig} from '../../DBConfig.js'
import bcrypt from 'bcrypt'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename y __dirname en un entorno ES6 (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const connection = await mysql.createConnection(DBConfig)

export class applicationModel {

    static async getAll () {
        const [applications] = await connection.query(
            'SELECT * FROM solicitud ORDER BY idSolicitud DESC',
        )
        return applications
    }

    static async getById ({ id }) {
        const [application] = await connection.query(
            'SELECT * FROM solicitud WHERE idSolicitud = ?',
            [id]
        )
        if(application.length === 0) {
            return null
        }
        return application[0]
    }
    static async getByUserId({ userId }) {
        const [applications] = await connection.query(
            `SELECT 
            s.idSolicitud,
            s.Estado,
            s.FechaInicio,
            s.FechaFin,
            s.archivoSolicitud,
            a.NumeroPlaca,
            a.Nombre AS NombreActivo,
            a.Descripcion AS DescripcionActivo,
            c.Nombre AS CategoriaActivo,
            u.CedulaCarnet,
            u.Nombre AS NombreUsuario
        FROM 
            solicitud s
        LEFT JOIN 
            activo a ON s.idActivo = a.NumeroPlaca
        LEFT JOIN 
            categoria c ON a.idCategoria = c.idCategoria
        LEFT JOIN 
            usuario u ON s.idUsuario = u.CedulaCarnet
        WHERE 
            s.idUsuario = ?
        ORDER BY s.idSolicitud DESC;`,
            [userId]
        );

        const applicationMap = {};

        applications.forEach((row) => {
            const {
                idSolicitud,
                Estado,
                FechaInicio,
                FechaFin,
                archivoSolicitud,
                NumeroPlaca,
                NombreActivo,
                DescripcionActivo,
                CategoriaActivo,
                CedulaCarnet,
                NombreUsuario
            } = row;

            if (!applicationMap[idSolicitud]) {
                applicationMap[idSolicitud] = {
                    idSolicitud,
                    Estado,
                    FechaInicio,
                    FechaFin,
                    archivoSolicitud,
                    usuario: {
                        CedulaCarnet,
                        NombreUsuario
                    },
                    activo: {
                        NumeroPlaca,
                        NombreActivo,
                        DescripcionActivo,
                        CategoriaActivo
                    }
                };
            }
        });
        return Object.values(applicationMap).sort((a, b) => b.idSolicitud - a.idSolicitud);
    }


    static async create ({ input }) {
        const {
            estado,
            idUsuario,
            idActivo,
            archivoSolicitud,
            fechaInicio,
            fechaFin
        } = input
        try {


            const [resultUser] = await connection.query(
                'SELECT cedulaCarnet FROM usuario WHERE CedulaCarnet = ?',
                [idUsuario]
            )
            if (resultUser.length <= 0) {
                return false
            }


            const [resultAsset] = await connection.query(
                'SELECT NumeroPlaca FROM activo WHERE NumeroPlaca = ?',
                [idActivo]
            )
            if (resultAsset.length <= 0) {
                return false
            }

            const fechaInicioToDate= new Date(fechaInicio)
            const fechaFinToDate= new Date(fechaFin)

            await connection.query(
                'INSERT INTO solicitud (Estado, idUsuario, idActivo, archivoSolicitud, FechaInicio, FechaFin) VALUES (?, ?, ?, ?, ?, ?)',
                [estado, idUsuario, idActivo, archivoSolicitud, fechaInicioToDate, fechaFinToDate]
            )

        }
        catch (error) {
            throw new Error("Error al crear la solicitud")
        }

        const [application] = await connection.query(
            `SELECT *
             FROM solicitud WHERE idSolicitud = LAST_INSERT_ID();`
        )
        return application[0]
    }

    static async delete({ id }) {
        try {

            const [rows] = await connection.query(
                'SELECT archivoSolicitud FROM solicitud WHERE idSolicitud = ?',
                [id]
            );

            if (rows.length > 0) {
                const archivoSolicitud = rows[0].archivoSolicitud;


                console.log("archivoSolicitud desde la base de datos:", archivoSolicitud);


                const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(archivoSolicitud));


                console.log("Ruta completa del archivo:", filePath);


                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error("Error al eliminar el archivo:", err);
                        } else {
                            console.log("Archivo eliminado:", archivoSolicitud);
                        }
                    });
                } else {
                    console.log("El archivo no existe en la ruta especificada:", filePath);
                }
            } else {
                console.log("No se encontró la solicitud con el ID:", id);
            }


            await connection.query(
                'DELETE FROM solicitud WHERE idSolicitud = ?',
                [id]
            );

            return true;

        } catch (error) {
            console.error("Error general:", error);
            throw new Error("Error al eliminar la solicitud");
        }
    }
    static async updateSignApplication({ id, input }) {
        const {
            estado,
            archivoSolicitud
        } = input
        try {

            const [result] = await connection.query(
              `UPDATE solicitud
                   SET Estado = (?),
                   ArchivoSolicitud = (?)
                   WHERE idSolicitud = ?;`,
              [estado, archivoSolicitud, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se encontro la solicitud con ese id');
            }

            const [updatedApplication] = await connection.query(
              `SELECT *
                    FROM solicitud WHERE idSolicitud = ?;`,
              [id]
            );

            return updatedApplication[0];
        } catch (error) {
            throw new Error(error);
        }
    }

    static async update({ id, input }) {
        const {
            estado
        } = input
        try {

            const [result] = await connection.query(
                `UPDATE solicitud
                   SET Estado = (?)  
                   WHERE idSolicitud = ?;`,
                [estado, id]
            );
            if (result.affectedRows === 0) {
                throw new Error('No se encontro la solicitud con ese id');
            }

            const [updatedApplication] = await connection.query(
                `SELECT *
                    FROM solicitud WHERE idSolicitud = ?;`,
                [id]
            );

            return updatedApplication[0];
        } catch (error) {
            throw new Error(error);
        }
    }
}