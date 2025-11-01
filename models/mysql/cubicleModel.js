import mysql from 'mysql2/promise'

import { DBConfig } from '../../DBConfig.js'
import {format} from "date-fns";
import {es} from "date-fns/locale";
import {sendEmail} from "../../services/emailService.js";

const connection = await mysql.createConnection(DBConfig)

export class cubicleModel {

    static async getAll () {
        const [cubicles] = await connection.query(
            'SELECT * FROM cubiculo',
        )

        return cubicles.map(({ Estado, Ventana, ...rest }) => ({
            ...rest,
            Estado: Estado === 1,
            Ventana: Ventana ===1
        }));

    }

    static async getById ({ id }) {
        const [cubicle] = await connection.query(
            'SELECT * FROM cubiculo WHERE idCubiculo = ?',
            [id]
        )
        if(cubicle.length === 0) {
            return null
        }

        const c = cubicle[0]

        return {
            ...c,
            Estado: Number(c.Estado) === 1,
            Ventana: Number(c.Ventana) === 1
        };

    }

    static async create ({ input }) {
        const {
            nombre,
            ventana,
            estado
        } = input
        try {

            const [result] = await connection.query(
                'SELECT nombre FROM cubiculo WHERE Nombre = ?',
                [nombre]
            )

            if (result.length > 0) {
                return false
            }

            await connection.query(
                'INSERT INTO cubiculo (Nombre, Ventana, Estado) VALUES (?, ?, ?)',
                [nombre, ventana, estado]
            )
        }
        catch (error) {
            throw new Error("Error al crear el cubiculo")
        }

        const [cubicle] = await connection.query(
            `SELECT *
             FROM cubiculo WHERE idCubiculo = LAST_INSERT_ID();`
        )
        return cubicle[0]
    }

    static async delete ({ id }) {
        try {
            const [result] = await connection.query(
                'SELECT * FROM reservacion WHERE idCubiculo = ?',
                [id]
            )

            if (result.length > 0) {
                return false
            }

            await connection.query(
                'DELETE FROM cubiculo WHERE idCubiculo = ?',
                [id]
            )
        }
        catch (error) {
            throw new Error("Error al eliminar el cubiculo ")
        }
        return true
    }

    static async update({ id, input }) {
        const {
            nombre,
            ventana,
            estado
        } = input

        try {
            const [duplicate] = await connection.query(
                'SELECT nombre FROM cubiculo WHERE Nombre = ?',
                [nombre]
            )
            if (duplicate.length > 0) {
                return false
            }

            const [result] = await connection.query(
                `UPDATE cubiculo
       SET Nombre = COALESCE(?, Nombre),
           Ventana = COALESCE(?, Ventana),
           Estado = COALESCE(?, Estado)
       WHERE idCubiculo = ?;`,
                [nombre, ventana, estado, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se encontro el cubiculo con ese id');
            }

            const [updatedCubicle] = await connection.query(
                `SELECT *
                 FROM cubiculo WHERE idCubiculo = ?;`,
                [id]
            );

            return updatedCubicle[0];
        } catch (error) {
            throw new Error(error);
        }
    }

    static async lock() {
        try {

            const [result] = await connection.query(
                `UPDATE cubiculo
                 SET Estado = 0;`
            );
            const [updatedCubicles] = await connection.query(
                `SELECT *
                 FROM cubiculo;`,
            );


            const [userDetails] = await connection.query(
                `SELECT Usuario.Nombre, Usuario.CorreoEmail
             FROM Usuario
             INNER JOIN Rol ON Usuario.idRol = Rol.idRol
             WHERE Rol.Nombre IN ('Administrador', 'Profesor');`
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

            const [result] = await connection.query(
                `UPDATE cubiculo
                 SET Estado = 1;`
            );
            const [updatedCubicles] = await connection.query(
                `SELECT *
                 FROM cubiculo;`,
            );


            const [userDetails] = await connection.query(
                `SELECT Usuario.Nombre, Usuario.CorreoEmail
             FROM Usuario
             INNER JOIN Rol ON Usuario.idRol = Rol.idRol
             WHERE Rol.Nombre IN ('Administrador', 'Profesor');`
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