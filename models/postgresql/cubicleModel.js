//import mysql from 'mysql2/promise'
import pkg from 'pg';
const { Pool } = pkg;
import { DBConfig } from '../../DBConfig.js'
import {format} from "date-fns";
import {es} from "date-fns/locale";
import {sendEmail} from "../../services/emailService.js";


const pool = new Pool(DBConfig);

export class cubicleModel {

    static async getAll() {
        const { rows: cubicles } = await pool.query(
            'SELECT * FROM cubiculo'
        );
        return cubicles;
    }

    static async getById({ id }) {
        const { rows: cubicle } = await pool.query(
            'SELECT * FROM cubiculo WHERE "idCubiculo" = $1',
            [id]
        );

        if (cubicle.length === 0) {
            return null;
        }

        return cubicle[0];
    }

    static async create({ input }) {
        const { nombre, ventana, estado } = input;

        try {
            // Verificar si ya existe un cubículo con ese nombre
            const { rows: result } = await pool.query(
                'SELECT "Nombre" FROM cubiculo WHERE "Nombre" = $1',
                [nombre]
            );

            if (result.length > 0) {
                return false;
            }

            // Insertar y obtener el id insertado usando RETURNING
            const { rows: inserted } = await pool.query(
                'INSERT INTO cubiculo ("Nombre", "Ventana", "Estado") VALUES ($1, $2, $3) RETURNING "idCubiculo"',
                [nombre, ventana, estado]
            );

            const insertedId = inserted[0].idCubiculo;

            // Obtener el cubículo insertado
            const { rows: cubicle } = await pool.query(
                'SELECT * FROM cubiculo WHERE "idCubiculo" = $1',
                [insertedId]
            );

            return cubicle[0];

        } catch (error) {
            throw new Error("Error al crear el cubiculo: " + error.message);
        }
    }
    static async delete({ id }) {
        try {
            const { rows: result } = await pool.query(
                'SELECT * FROM reservacion WHERE "idCubiculo" = $1',
                [id]
            );

            if (result.length > 0) {
                return false;
            }

            await pool.query(
                'DELETE FROM cubiculo WHERE "idCubiculo" = $1',
                [id]
            );
        }
        catch (error) {
            throw new Error("Error al eliminar el cubiculo ");
        }
        return true;
    }

    static async update({ id, input }) {
        const {
            nombre,
            ventana,
            estado
        } = input;

        try {
            const { rows: duplicate } = await pool.query(
                'SELECT "Nombre" FROM cubiculo WHERE "Nombre" = $1',
                [nombre]
            );

            if (duplicate.length > 0) {
                return false;
            }

            const result = await pool.query(
                `UPDATE cubiculo
             SET "Nombre" = COALESCE($1, "Nombre"),
                 "Ventana" = COALESCE($2, "Ventana"),
                 "Estado" = COALESCE($3, "Estado")
             WHERE "idCubiculo" = $4`,
                [nombre, ventana, estado, id]
            );

            if (result.rowCount === 0) {
                throw new Error('No se encontro el cubiculo con ese id');
            }

            const { rows: updatedCubicle } = await pool.query(
                `SELECT *
                 FROM cubiculo WHERE "idCubiculo" = $1`,
                [id]
            );

            return updatedCubicle[0];
        } catch (error) {
            throw new Error(error);
        }
    }

    static async lock() {
        try {

            await pool.query(
                `UPDATE cubiculo
             SET "Estado" = 0;`
            );

            const { rows: updatedCubicles } = await pool.query(
                `SELECT *
                 FROM cubiculo;`
            );

            const { rows: userDetails } = await pool.query(
                `SELECT "usuario"."Nombre", "usuario"."CorreoEmail"
                 FROM "usuario"
                          INNER JOIN "rol" ON "usuario"."idRol" = "rol"."idRol"
                 WHERE "rol"."Nombre" IN ('Administrador', 'Profesor');`
            );

            const emailSubject = 'Bloqueo de cubículos';


            userDetails.forEach(({ Nombre, CorreoEmail }) => {
                const emailText = `
            Hola ${Nombre},
            
            Debido a temas administrativos, se ha bloqueado temporalmente la opción de reservar cubículos. Será notificado cuando esta opción vuelva a estar disponible.
            `;

                const emailHtml = `
<div style="padding: 20px; background-color: #f4f4f4;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Contenedor del Logo Centrador -->
        <table border="0" cellpadding="0" cellspacing="0" style="text-align: center;">
          <tr>
            <!-- Texto "TEC" -->
            <td style="background-color: #ffffff; padding: 10px 20px; color: #000000; font-family: 'Georgia', serif; font-size: 36px; font-weight: bold;">
              TEC
            </td>
            <!-- Línea Roja Separadora -->
            <td style="width: 5px; background-color: #c1272d;"></td>
            <!-- Texto "Tecnológico de Costa Rica" -->
            <td style="background-color: #ffffff; padding: 10px 20px; color: #000000; font-family: 'Georgia', serif; font-size: 18px;">
              Centro Academico<br>de Alajuela
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Asunto -->
        <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${emailSubject}</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 10px 0;">
        <!-- Mensaje de Bloqueo -->
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Hola ${Nombre}, debido a temas administrativos, se ha bloqueado temporalmente la opción de reservar cubículos. Será notificado cuando esta opción vuelva a estar disponible.
        </p>
      </td>
    </tr>
  </table>
</div>
`;

                // Enviar el correo a cada usuario
                sendEmail(
                    CorreoEmail,
                    emailSubject,
                    emailText,
                    emailHtml
                );
            });

            return updatedCubicles;
        } catch (error) {
            throw new Error("Error al actualizar la sala");
        }
    }



    static async unLock() {
        try {

            await pool.query(
                `UPDATE cubiculo
             SET "Estado" = 1;`
            );

            const { rows: updatedCubicles } = await pool.query(
                `SELECT *
                 FROM cubiculo;`
            );

            const { rows: userDetails } = await pool.query(
                `SELECT "usuario"."Nombre", "usuario"."CorreoEmail"
                 FROM "usuario"
                          INNER JOIN "rol" ON "usuario"."idRol" = "rol"."idRol"
                 WHERE "rol"."Nombre" IN ('Administrador', 'Profesor');`
            );


            const emailSubject = 'Reactivación de reservas de cubículos';

            // Enviar el correo solo a los usuarios con los roles especificados
            userDetails.forEach(({ Nombre, CorreoEmail }) => {
                const emailText = `
            Hola ${Nombre},
            
            Nos complace informarle que la opción de reservar cubículos ha sido reactivada. Ya puede realizar sus reservas nuevamente.
            `;

                const emailHtml = `
<div style="padding: 20px; background-color: #f4f4f4;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Contenedor del Logo Centrador -->
        <table border="0" cellpadding="0" cellspacing="0" style="text-align: center;">
          <tr>
            <!-- Texto "TEC" -->
            <td style="background-color: #ffffff; padding: 10px 20px; color: #000000; font-family: 'Georgia', serif; font-size: 36px; font-weight: bold;">
              TEC
            </td>
            <!-- Línea Roja Separadora -->
            <td style="width: 5px; background-color: #c1272d;"></td>
            <!-- Texto "Tecnológico de Costa Rica" -->
            <td style="background-color: #ffffff; padding: 10px 20px; color: #000000; font-family: 'Georgia', serif; font-size: 18px;">
              Centro Academico<br>de Alajuela
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Asunto -->
        <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${emailSubject}</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 10px 0;">
        <!-- Mensaje de Reactivación -->
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Hola ${Nombre}, nos complace informarle que la opción de reservar cubículos ha sido reactivada. Ya puede realizar sus reservas nuevamente.
        </p>
      </td>
    </tr>
  </table>
</div>
`;

                // Enviar el correo a cada usuario
                sendEmail(
                    CorreoEmail,
                    emailSubject,
                    emailText,
                    emailHtml
                );
            });

            return updatedCubicles;
        } catch (error) {
            throw new Error("Error al actualizar la sala");
        }
    }




}