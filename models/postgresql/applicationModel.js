import pkg from 'pg';
import {DBConfig} from '../../DBConfig.js'
const { Pool } = pkg;
import bcrypt from 'bcrypt'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename y __dirname en un entorno ES6 (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const pool = new Pool(DBConfig);

export class applicationModel {

    static async getAll() {
      const { rows: applications } = await pool.query(
        'SELECT * FROM "solicitud" ORDER BY "idSolicitud" DESC'
      );
      return applications;
    }

    static async getById({ id }) {
      const { rows: application } = await pool.query(
        'SELECT * FROM "solicitud" WHERE "idSolicitud" = $1',
        [id]
      );

      if (application.length === 0) {
        return null;
      }

      return application[0];
    }

    static async getByUserId({ userId }) {
      const { rows: applications } = await pool.query(
        `SELECT
            s."idSolicitud",
            s."Estado",
            s."FechaInicio",
            s."FechaFin",
            s."archivoSolicitud",
            a."NumeroPlaca",
            a."Nombre" AS "NombreActivo",
            a."Descripcion" AS "DescripcionActivo",
            c."Nombre" AS "CategoriaActivo",
            u."CedulaCarnet",
            u."Nombre" AS "NombreUsuario"
         FROM
            "solicitud" s
         LEFT JOIN
            "activo" a ON s."idActivo" = a."NumeroPlaca"
         LEFT JOIN
            "categoria" c ON a."idCategoria" = c."idCategoria"
         LEFT JOIN
            "usuario" u ON s."idUsuario" = u."CedulaCarnet"
         WHERE
            s."idUsuario" = $1
         ORDER BY s."idSolicitud" DESC;`,
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



    static async create({ input }) {
      const {
        estado,
        idUsuario,
        idActivo,
        archivoSolicitud,
        fechaInicio,
        fechaFin
      } = input;

      try {
        // Validar existencia de usuario
        const { rows: resultUser } = await pool.query(
          'SELECT "CedulaCarnet" FROM "usuario" WHERE "CedulaCarnet" = $1',
          [idUsuario]
        );
        if (resultUser.length === 0) {
          return false;
        }

        // Validar existencia de activo
        const { rows: resultAsset } = await pool.query(
          'SELECT "NumeroPlaca" FROM "activo" WHERE "NumeroPlaca" = $1',
          [idActivo]
        );
        if (resultAsset.length === 0) {
          return false;
        }

        const fechaInicioToDate = new Date(fechaInicio);
        const fechaFinToDate = new Date(fechaFin);

        // Insertar solicitud y devolver la fila insertada
        const { rows: application } = await pool.query(
          `INSERT INTO "solicitud"
            ("Estado", "idUsuario", "idActivo", "archivoSolicitud", "FechaInicio", "FechaFin")
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [estado, idUsuario, idActivo, archivoSolicitud, fechaInicioToDate, fechaFinToDate]
        );

        return application[0];
      } catch (error) {
        throw new Error("Error al crear la solicitud");
      }
    }


    static async delete({ id }) {
      try {
        // Buscar el archivo asociado a la solicitud
        const { rows } = await pool.query(
          'SELECT "archivoSolicitud" FROM "solicitud" WHERE "idSolicitud" = $1',
          [id]
        );

        if (rows.length > 0) {
          const archivoSolicitud = rows[0].archivoSolicitud;
          console.log("archivoSolicitud desde la base de datos:", archivoSolicitud);

          const filePath = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            path.basename(archivoSolicitud)
          );

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

        // Eliminar la solicitud en la BD
        await pool.query(
          'DELETE FROM "solicitud" WHERE "idSolicitud" = $1',
          [id]
        );

        return true;
      } catch (error) {
        console.error("Error general:", error);
        throw new Error("Error al eliminar la solicitud");
      }
    }


    static async updateSignApplication({ id, input }) {
      const { estado, archivoSolicitud } = input;

      try {
        // Ejecutar el UPDATE
        const result = await pool.query(
          `UPDATE "solicitud"
             SET "Estado" = $1,
                 "archivoSolicitud" = $2
           WHERE "idSolicitud" = $3`,
          [estado, archivoSolicitud, id]
        );

        if (result.rowCount === 0) {
          throw new Error("No se encontró la solicitud con ese id");
        }

        // Devolver el registro actualizado
        const { rows } = await pool.query(
          `SELECT *
             FROM "solicitud"
           WHERE "idSolicitud" = $1`,
          [id]
        );

        return rows[0];
      } catch (error) {
        throw new Error(error.message || "Error al actualizar la solicitud");
      }
    }


    static async update({ id, input }) {
      const { estado } = input;

      try {
        const result = await pool.query(
          `UPDATE "solicitud"
             SET "Estado" = $1
           WHERE "idSolicitud" = $2
           RETURNING *;`,
          [estado, id]
        );

        if (result.rowCount === 0) {
          throw new Error("No se encontró la solicitud con ese id");
        }

        return result.rows[0];
      } catch (error) {
        throw new Error(error.message || "Error al actualizar la solicitud");
      }
    }
}