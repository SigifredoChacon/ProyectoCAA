import pkg from 'pg';
const { Pool } = pkg;
import {DBConfig} from '../../DBConfig.js'
import {sendEmail} from "../../services/emailService.js";


const pool = new Pool(DBConfig);

export class RoomModel {

    static async getAll() {
        const { rows: rooms } = await pool.query(
            'SELECT * FROM sala'
        );
        return rooms;
    }

    static async getById({ id }) {
        const { rows: room } = await pool.query(
            'SELECT * FROM sala WHERE "idSala" = $1',
            [id]
        );
        if (room.length === 0) {
            return null;
        }
        return room[0];
    }

    static async getNameById({ id }) {
        const { rows: room } = await pool.query(
            'SELECT "Nombre" FROM sala WHERE "idSala" = $1',
            [id]
        );
        if (room.length === 0) {
            return null;
        }
        return room[0];
    }

    static async create({ input }) {
        const {
            imagen,
            nombre,
            descripcion,
            restricciones,
            estado
        } = input;

        try {
            const { rows: existing } = await pool.query(
                'SELECT "Nombre" FROM sala WHERE "Nombre" = $1',
                [nombre]
            );

            if (existing.length > 0) {
                return false;
            }

            const { rows: rooms } = await pool.query(
                'INSERT INTO sala ("Imagen", "Nombre", "Descripcion", "Restricciones", "Estado") VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [imagen, nombre, descripcion, restricciones, estado]
            );

            return rooms[0];
        } catch (error) {
            throw new Error(error);
        }
    }

    static async delete({ id }) {
        try {
            const { rows: result } = await pool.query(
                'SELECT * FROM reservacion WHERE "idSala" = $1',
                [id]
            );

            if (result.length > 0) {
                return false;
            }

            await pool.query(
                'DELETE FROM sala WHERE "idSala" = $1',
                [id]
            );
        } catch (error) {
            throw new Error("Error al eliminar la sala");
        }
        return true;
    }


    static async update({ id, input }) {
        const {
            imagen,
            nombre,
            descripcion,
            restricciones,
            estado
        } = input;

        try {
            const { rows: duplicate } = await pool.query(
                'SELECT "Nombre" FROM sala WHERE "Nombre" = $1',
                [nombre]
            );

            if (duplicate.length > 0) {
                return false;
            }

            const result = await pool.query(
                `UPDATE sala
             SET "Imagen" = COALESCE($1, "Imagen"),
                 "Nombre" = COALESCE($2, "Nombre"),
                 "Descripcion" = COALESCE($3, "Descripcion"),
                 "Restricciones" = COALESCE($4, "Restricciones"),
                 "Estado" = COALESCE($5, "Estado")
             WHERE "idSala" = $6`,
                [imagen, nombre, descripcion, restricciones, estado, id]
            );

            if (result.rowCount === 0) {
                throw new Error('No se encontro la sala con ese id');
            }

            const { rows: updatedRoom } = await pool.query(
                'SELECT * FROM sala WHERE "idSala" = $1',
                [id]
            );

            return updatedRoom[0];
        } catch (error) {
            throw new Error("Error al actualizar la sala");
        }
    }

    static async lock() {
        try {

            // Actualizar estado de todas las salas a 0
            await pool.query(
                `UPDATE sala
             SET "Estado" = false;`
            );

            // Obtener todas las salas actualizadas
            const { rows: updatedRooms } = await pool.query(
                `SELECT *
             FROM sala;`
            );

            // Obtener usuarios con roles especificados
            const { rows: userDetails } = await pool.query(
                `SELECT "usuario"."Nombre", "usuario"."CorreoEmail"
                 FROM "usuario"
                          INNER JOIN "rol" ON "usuario"."idRol" = "rol"."idRol"
                 WHERE "rol"."nombre" IN ('Administrador', 'Profesor', 'Estudiante');`
            );


            const emailSubject = 'Bloqueo de Salas';

            userDetails.forEach(({ Nombre, CorreoEmail }) => {
                const emailText = `
            Hola ${Nombre},
            
            Debido a temas administrativos, se ha bloqueado temporalmente la opción de reservar salas. Será notificado cuando esta opción vuelva a estar disponible.
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
          Hola ${Nombre}, debido a temas administrativos, se ha bloqueado temporalmente la opción de reservar salas. Será notificado cuando esta opción vuelva a estar disponible.
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


            return updatedRooms;
        } catch (error) {
            throw new Error("Error al actualizar la sala");
        }
    }

    static async unLock() {
        try {

            // Actualizar estado de todas las salas a 1
            await pool.query(
                `UPDATE sala
             SET "Estado" = true;`
            );

            // Obtener todas las salas actualizadas
            const { rows: updatedRooms } = await pool.query(
                `SELECT *
             FROM sala;`
            );

            // Obtener usuarios con roles especificados
            const { rows: userDetails } = await pool.query(
                `SELECT "usuario"."Nombre", "usuario"."CorreoEmail"
                 FROM "usuario"
                          INNER JOIN "rol" ON "usuario"."idRol" = "rol"."idRol"
                 WHERE "rol"."nombre" IN ('Administrador', 'Profesor', 'Estudiante');`
            );

            const emailSubject = 'Reactivación de reservas de Salas';

            // Enviar el correo solo a los usuarios con los roles especificados
            userDetails.forEach(({ Nombre, CorreoEmail }) => {
                const emailText = `
            Hola ${Nombre},
            
            Nos complace informarle que la opción de reservar salas ha sido reactivada. Ya puede realizar sus reservas nuevamente.
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
          Hola ${Nombre}, nos complace informarle que la opción de reservar salas ha sido reactivada. Ya puede realizar sus reservas nuevamente.
        </p>
      </td>
    </tr>
  </table>
</div>
`;


                sendEmail(
                    CorreoEmail,
                    emailSubject,
                    emailText,
                    emailHtml
                );
            });



            return updatedRooms;
        } catch (error) {
            throw new Error("Error al actualizar la sala");
        }
    }

}