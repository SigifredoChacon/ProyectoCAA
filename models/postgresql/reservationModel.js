import {sendEmail} from "../../services/emailService.js";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import pkg from 'pg';
const { Pool } = pkg;
import {DBConfig} from '../../DBConfig.js'

const pool = new Pool(DBConfig);


export class reservationModel {

    static async getAll({ page = 1, itemsPerPage = 10 }) {
        const offset = (page - 1) * itemsPerPage;

        // Contar el número total de reservaciones (sin duplicados)
        const { rows: totalCountResult } = await pool.query(
            `SELECT COUNT(*) AS "total"
             FROM "reservacion" r
             WHERE r."Estado" = true;`
        );

        const totalReservations = parseInt(totalCountResult[0].total, 10);
        const totalPages = Math.ceil(totalReservations / itemsPerPage);

        // Obtener las reservaciones paginadas con recursos agrupados y ordenadas
        const { rows: reservations } = await pool.query(
            `SELECT
                 r."idReservacion",
                 r."Fecha",
                 r."HoraInicio",
                 r."HoraFin",
                 r."idSala",
                 r."idCubiculo",
                 r."idUsuario",
                 r."EncuestaCompletada",
                 r."Observaciones",
                 r."Refrigerio",
                 COALESCE(
                         JSON_AGG(
                                 JSON_BUILD_OBJECT(
                                         'idRecurso', rec."idRecursos",
                                         'NombreRecurso', rec."Nombre"
                                 )
                         ) FILTER (WHERE rec."idRecursos" IS NOT NULL),
                         '[]'
                 ) AS "recursos"
             FROM "reservacion" r
                      LEFT JOIN "reservacion_recursos" rr
                                ON r."idReservacion" = rr."idReservacion"
                      LEFT JOIN "recursos" rec
                                ON rr."idRecurso" = rec."idRecursos"
             WHERE r."Estado" = true
             GROUP BY r."idReservacion"
             ORDER BY
                 CASE
                     WHEN (r."Fecha"::timestamp + r."HoraInicio"::interval) >= NOW() THEN 0
                     ELSE 1
                     END,
                 CASE
                     WHEN (r."Fecha"::timestamp + r."HoraInicio"::interval) >= NOW()
                         THEN (r."Fecha"::timestamp + r."HoraInicio"::interval)
                     END ASC,
                 CASE
                     WHEN (r."Fecha"::timestamp + r."HoraInicio"::interval) < NOW()
                         THEN (r."Fecha"::timestamp + r."HoraInicio"::interval)
                     END DESC
                 LIMIT $1 OFFSET $2;`,
            [itemsPerPage, offset]
        );


        return {
            reservations,
            totalPages,
            totalReservations: totalCountResult[0].total
        };
    }



    static async getAllPendingReservations () {
    const { rows: reservations } = await pool.query(
        `SELECT
           r."idReservacion",
           r."Fecha",
           r."HoraInicio",
           r."HoraFin",
           r."idSala",
           r."idCubiculo",
           r."idUsuario",
           r."Observaciones",
           r."Refrigerio",
           rr."idRecurso",
           rec."Nombre" AS "NombreRecurso"
         FROM
           "reservacion" r
             LEFT JOIN
           "reservacion_recursos" rr ON r."idReservacion" = rr."idReservacion"
             LEFT JOIN
           "recursos" rec ON rr."idRecurso" = rec."idRecursos"
         WHERE r."Estado" = false;`
    );

    const reservationMap = {};

    reservations.forEach((row) => {
      const {
        idReservacion,
        Fecha,
        HoraInicio,
        HoraFin,
        idSala,
        idCubiculo,
        idUsuario,
        Observaciones,
        Refrigerio,
        idRecurso,
        NombreRecurso,
      } = row;

      if (!reservationMap[idReservacion]) {
        reservationMap[idReservacion] = {
          idReservacion,
          Fecha,
          HoraInicio,
          HoraFin,
          idSala,
          idCubiculo,
          idUsuario,
          Refrigerio,
          Observaciones,
          recursos: [],
        };
      }

      if (idRecurso) {
        reservationMap[idReservacion].recursos.push({
          idRecurso,
          NombreRecurso,
        });
      }
    });

    return Object.values(reservationMap);
  }



  static async getById({ id }) {
    const { rows: resources } = await pool.query(
        `SELECT
           r."idReservacion",
           r."Fecha",
           r."HoraInicio",
           r."HoraFin",
           r."idSala",
           r."idCubiculo",
           r."idUsuario",
           rr."idRecurso",
           rec."Nombre" AS "NombreRecurso"
         FROM
           "reservacion" r
             LEFT JOIN
           "reservacion_recursos" rr ON r."idReservacion" = rr."idReservacion"
             LEFT JOIN
           "recursos" rec ON rr."idRecurso" = rec."idRecursos"
         WHERE
           r."idReservacion" = $1;`,
        [id]
    );

    if (resources.length === 0) {
      return null;
    }

    const reservacion = {
      idReservacion: resources[0].idReservacion,
      Fecha: resources[0].Fecha,
      HoraInicio: resources[0].HoraInicio,
      HoraFin: resources[0].HoraFin,
      idSala: resources[0].idSala,
      idCubiculo: resources[0].idCubiculo,
      idUsuario: resources[0].idUsuario,
      recursos: resources
          .map((row) => ({
            idRecurso: row.idRecurso,
            NombreRecurso: row.NombreRecurso,
          }))
          .filter((recurso) => recurso.idRecurso !== null),
    };

    return reservacion;
  }



  static async getByDate({ date }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           *
         FROM
           "reservacion" r
         WHERE
           r."Fecha" = $1;`,
        [date]
    );

    return reservations;
  }


  static async getByRoomId({ roomId }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           r."idReservacion",
           r."Fecha",
           r."HoraInicio",
           r."HoraFin",
           r."idSala",
           r."idCubiculo",
           r."idUsuario",
           rr."idRecurso",
           rec."Nombre" AS "NombreRecurso"
         FROM
           "reservacion" r
             LEFT JOIN
           "reservacion_recursos" rr ON r."idReservacion" = rr."idReservacion"
             LEFT JOIN
           "recursos" rec ON rr."idRecurso" = rec."idRecursos"
         WHERE
           r."idSala" = $1;`,
        [roomId]
    );

    const reservationMap = {};

    reservations.forEach((row) => {
      const {
        idReservacion,
        Fecha,
        HoraInicio,
        HoraFin,
        idSala,
        idCubiculo,
        idUsuario,
        idRecurso,
        NombreRecurso,
      } = row;

      if (!reservationMap[idReservacion]) {
        reservationMap[idReservacion] = {
          idReservacion,
          Fecha,
          HoraInicio,
          HoraFin,
          idSala,
          idCubiculo,
          idUsuario,
          recursos: [],
        };
      }

      if (idRecurso) {
        reservationMap[idReservacion].recursos.push({
          idRecurso,
          NombreRecurso,
        });
      }
    });

    return Object.values(reservationMap);
  }



  static async getReservationsByCubicleIdAndWeek({ cubicleId, startDate, endDate }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           r."idReservacion",
           r."Fecha",
           r."HoraInicio",
           r."HoraFin",
           r."idSala",
           r."idCubiculo",
           r."idUsuario",
           rr."idRecurso",
           rec."Nombre" AS "NombreRecurso"
         FROM
           "reservacion" r
             LEFT JOIN
           "reservacion_recursos" rr ON r."idReservacion" = rr."idReservacion"
             LEFT JOIN
           "recursos" rec ON rr."idRecurso" = rec."idRecursos"
         WHERE
           r."idCubiculo" = $1
           AND r."Fecha" BETWEEN $2 AND $3;`,
        [cubicleId, startDate, endDate]
    );

    const reservationMap = {};
    reservations.forEach((row) => {
      const {
        idReservacion,
        Fecha,
        HoraInicio,
        HoraFin,
        idSala,
        idCubiculo,
        idUsuario,
        idRecurso,
        NombreRecurso,
      } = row;

      if (!reservationMap[idReservacion]) {
        reservationMap[idReservacion] = {
          idReservacion,
          Fecha,
          HoraInicio,
          HoraFin,
          idSala,
          idCubiculo,
          idUsuario,
          recursos: [],
        };
      }

      if (idRecurso) {
        reservationMap[idReservacion].recursos.push({
          idRecurso,
          NombreRecurso,
        });
      }
    });

    return Object.values(reservationMap);
  }



  static async getReservationsByRoomIdAndWeek({ roomId, startDate, endDate }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           r."idReservacion",
           r."Fecha",
           r."HoraInicio",
           r."HoraFin",
           r."idSala",
           r."idCubiculo",
           r."idUsuario",
           rr."idRecurso",
           rec."Nombre" AS "NombreRecurso"
         FROM
           "reservacion" r
             LEFT JOIN
           "reservacion_recursos" rr ON r."idReservacion" = rr."idReservacion"
             LEFT JOIN
           "recursos" rec ON rr."idRecurso" = rec."idRecursos"
         WHERE
           r."idSala" = $1 AND r."Fecha" BETWEEN $2 AND $3;`,
        [roomId, startDate, endDate]
    );

    const reservationMap = {};
    reservations.forEach((row) => {
      const {
        idReservacion,
        Fecha,
        HoraInicio,
        HoraFin,
        idSala,
        idCubiculo,
        idUsuario,
        idRecurso,
        NombreRecurso,
      } = row;

      if (!reservationMap[idReservacion]) {
        reservationMap[idReservacion] = {
          idReservacion,
          Fecha,
          HoraInicio,
          HoraFin,
          idSala,
          idCubiculo,
          idUsuario,
          recursos: [],
        };
      }

      if (idRecurso) {
        reservationMap[idReservacion].recursos.push({
          idRecurso,
          NombreRecurso,
        });
      }
    });

    return Object.values(reservationMap);
  }



  static async getByCubicleId({ cubicleId }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           *
         FROM
           "reservacion"
         WHERE
           "idCubiculo" = $1;`,
        [cubicleId]
    );

    return reservations;
  }


  static async getByYear({ year }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           *
         FROM
           "reservacion"
         WHERE
           EXTRACT(YEAR FROM "Fecha") = $1;`,
        [year]
    );

    return reservations;
  }


  static async getByMonth({ year, month }) {
    const { rows: reservations } = await pool.query(
        `SELECT 
        *
     FROM 
        "reservacion"
     WHERE 
        EXTRACT(YEAR FROM "Fecha") = $1 
        AND EXTRACT(MONTH FROM "Fecha") = $2;`,
        [year, month]
    );

    return reservations;
  }


  static async getByDateRange({ startDate, endDate }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           *
         FROM
           "reservacion"
         WHERE
           "Fecha" BETWEEN $1 AND $2;`,
        [startDate, endDate]
    );

    return reservations;
  }

  static async getByUserIdCompleted({ id }) {
    const { rows: reservations } = await pool.query(
        `SELECT
           *
         FROM
           "reservacion"
         WHERE
           "idUsuario" = $1 AND "EncuestaCompletada" = false;`,
        [id]
    );

    return reservations;
  }


    static async getByUserId({ userId, page = 1, itemsPerPage = 10 }) {
        const offset = (page - 1) * itemsPerPage;

        // Contar el número total de reservaciones (sin duplicados)
        const { rows: totalCountResult } = await pool.query(
            `SELECT COUNT(*) as total
             FROM "reservacion" r
             WHERE r."Estado" = true AND r."idUsuario" = $1;`,
            [userId]
        );

        const totalReservations = parseInt(totalCountResult[0].total, 10);
        const totalPages = Math.ceil(totalReservations / itemsPerPage);

        // Obtener las reservaciones paginadas con recursos agrupados
        const { rows: reservations } = await pool.query(
            `SELECT
                 r."idReservacion",
                 r."Fecha",
                 r."HoraInicio",
                 r."HoraFin",
                 r."idSala",
                 r."idCubiculo",
                 r."idUsuario",
                 r."EncuestaCompletada",
                 r."Observaciones",
                 r."Refrigerio",
                 COALESCE(
                         JSON_AGG(
                                 JSON_BUILD_OBJECT(
                                         'idRecurso', rec."idRecursos",
                                         'NombreRecurso', rec."Nombre"
                                 )
                         ) FILTER (WHERE rec."idRecursos" IS NOT NULL),
                         '[]'
                 ) AS "recursos"
             FROM "reservacion" r
                      LEFT JOIN "reservacion_recursos" rr
                                ON r."idReservacion" = rr."idReservacion"
                      LEFT JOIN "recursos" rec
                                ON rr."idRecurso" = rec."idRecursos"
             WHERE r."Estado" = true AND r."idUsuario" = $1
             GROUP BY r."idReservacion"
             ORDER BY
                 CASE
                     WHEN (r."Fecha"::timestamp + r."HoraInicio"::interval) >= NOW() THEN 0
                     ELSE 1
                     END,
                 CASE
                     WHEN (r."Fecha"::timestamp + r."HoraInicio"::interval) >= NOW()
                         THEN (r."Fecha"::timestamp + r."HoraInicio"::interval)
                     END ASC,
                 CASE
                     WHEN (r."Fecha"::timestamp + r."HoraInicio"::interval) < NOW()
                         THEN (r."Fecha"::timestamp + r."HoraInicio"::interval)
                     END DESC
                 LIMIT $2 OFFSET $3;`,
            [userId, itemsPerPage, offset]
        );


        return {
            reservations,
            totalPages
        };
    }












    static async create({ input }) {
    const {
      fecha,
      horaInicio,
      horaFin,
      idSala,
      idCubiculo,
      idUsuario,
      observaciones,
      refrigerio,
      idRecursos,
      estado,
      encuestaCompletada,
    } = input;

    try {

        if ((!idSala && !idCubiculo) || (idSala && idCubiculo)) {
            throw new Error ('Debes seleccionar una sala O un cubículo (solo uno).');
        }
        if (!horaInicio || !horaFin) throw new Error ('Faltan horaInicio/horaFin.');
        if (horaInicio >= horaFin) throw new Error ('La hora de fin debe ser mayor que la de inicio.');


        const esSala = !!idSala;
        const espacioWhere = esSala ? '"idSala" = $2' : ' "idCubiculo" = $2';
        const espacioId = esSala ? idSala : idCubiculo;

        const {rows: conflicts} = await pool.query(

            `SELECT "idReservacion", "HoraInicio", "HoraFin"
                            FROM "reservacion"
                            WHERE "Fecha" = $1
                            AND ${espacioWhere}
                            AND "Estado" = true
                            AND "HoraInicio" < $3 
                            AND "HoraFin" > $4
                            FOR UPDATE;`, [fecha,espacioId,horaFin,horaInicio]

        )

        if (conflicts.length > 0) {
            const c = conflicts[0];
            throw new Error(`Ya existe una reservación en esa fecha y espacio.`);
        }

      // Insertar reservación y devolver la fila insertada
      const { rows: result } = await pool.query(
          `INSERT INTO "reservacion" 
        ("Fecha","HoraInicio","HoraFin","idSala","idCubiculo","idUsuario","Observaciones","Refrigerio","Estado","EncuestaCompletada") 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *;`,
          [fechaToDate, horaInicio, horaFin, idSala, idCubiculo, idUsuario, observaciones, refrigerio, estado, encuestaCompletada]
      );

      const reservationDetails = result[0];

      // Obtener datos de usuario
      const { rows: userDetails } = await pool.query(
          `SELECT "Nombre", "CorreoEmail" FROM "usuario" WHERE "CedulaCarnet" = $1;`,
          [idUsuario]
      );

      // Obtener detalles de cubículo y sala
      const { rows: cubicleDetails } = await pool.query(
          `SELECT "Nombre" FROM "cubiculo" WHERE "idCubiculo" = $1;`,
          [idCubiculo]
      );

      const { rows: roomDetails } = await pool.query(
          `SELECT "Nombre" FROM "sala" WHERE "idSala" = $1;`,
          [idSala]
      );

      // Enviar email si hay usuario y la reserva está activa
      if (userDetails.length > 0 && estado) {
        const { Nombre, CorreoEmail } = userDetails[0];
        const emailSubject = 'Confirmación de Reservación';
        const formattedDate = format(new Date(reservationDetails.Fecha), 'EEEE, dd MMMM yyyy', { locale: es });

        const emailText = `
Hola ${Nombre},

Se ha realizado una nueva reservación con los siguientes detalles:
Fecha: ${reservationDetails.Fecha}
Hora de Inicio: ${reservationDetails.HoraInicio}
Hora de Fin: ${reservationDetails.HoraFin}
Sala: ${idSala ? `Sala ${roomDetails[0].Nombre}` : 'N/A'}
Cubículo: ${idCubiculo ? `Cubículo ${cubicleDetails[0].Nombre}` : 'N/A'}
Observaciones: ${observaciones || 'Ninguna'}
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
        <!-- Detalles de la reservación -->
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Se ha realizado una nueva reservación con los siguientes detalles:
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          <strong>Fecha:</strong> ${formattedDate}<br>
          <strong>Hora de Inicio:</strong> ${reservationDetails.HoraInicio}<br>
          <strong>Hora de Fin:</strong> ${reservationDetails.HoraFin}<br>
          ${idSala ? `<strong>Sala:</strong> ${roomDetails[0].Nombre}<br>` : ''}
          ${idCubiculo ? `<strong>Cubículo:</strong>  ${cubicleDetails[0].Nombre}<br>` : ''}
          ${observaciones ? `<strong>Observaciones:</strong> ${observaciones}<br>` : ''} 
          ${refrigerio ? '<strong>Refrigerio:</strong> Sí (Según disponibilidad)' : ''}
        </p>
      </td>
    </tr>
  </table>
</div>
`;

        sendEmail(CorreoEmail, emailSubject, emailText, emailHtml);
      }

      // Insertar recursos asociados
      if (Array.isArray(idRecursos) && idRecursos.length > 0) {
        const insertPromises = idRecursos.map(idRecurso => {
          return pool.query(
              `INSERT INTO "reservacion_recursos" ("idReservacion","idRecurso") VALUES ($1,$2);`,
              [reservationDetails.idReservacion, idRecurso]
          );
        });
        await Promise.all(insertPromises);
      }

      return reservationDetails;
    } catch (error) {
        return error.message;
    }
  }


  static async deleteByDate({ date }) {
    try {

      const { rows: reservations } = await pool.query(
          `SELECT * FROM "reservacion" WHERE "Fecha" = $1;`,
          [date]
      );


      for (const reservation of reservations) {
        await pool.query(
            `DELETE FROM "reservacion_recursos" WHERE "idReservacion" = $1;`,
            [reservation.idReservacion]
        );
      }

      // Eliminar las reservaciones
      await pool.query(
          `DELETE FROM "reservacion" WHERE "Fecha" = $1;`,
          [date]
      );

    } catch (error) {
      throw new Error(error);
    }

    return true;
  }


  static async delete({ id }) {
    try {
      // Obtener la reservación
      const { rows: reservations } = await pool.query(
          `SELECT * FROM "reservacion" WHERE "idReservacion" = $1;`,
          [id]
      );

      const reservation = reservations[0];

      if (!reservation) {
        throw new Error("Reservación no encontrada");
      }

      // Eliminar recursos asociados
      await pool.query(
          `DELETE FROM "reservacion_recursos" WHERE "idReservacion" = $1;`,
          [id]
      );

      // Eliminar la reservación
      await pool.query(
          `DELETE FROM "reservacion" WHERE "idReservacion" = $1;`,
          [id]
      );

      // Si la reserva estaba pendiente (Estado = 0), enviar email de rechazo
      if (reservation.Estado === 0) {

        const { rows: userDetails } = await pool.query(
            `SELECT "Nombre", "CorreoEmail" FROM "usuario" WHERE "CedulaCarnet" = $1;`,
            [reservation.idUsuario]
        );

        const { rows: cubicleDetails } = await pool.query(
            `SELECT "Nombre" FROM "cubiculo" WHERE "idCubiculo" = $1;`,
            [reservation.idCubiculo]
        );

        const { rows: roomDetails } = await pool.query(
            `SELECT "Nombre" FROM "sala" WHERE "idSala" = $1;`,
            [reservation.idSala]
        );

        if (userDetails.length > 0) {
          const { Nombre, CorreoEmail } = userDetails[0];

          const reservationDetails = reservation;
          const emailSubject = 'Rechazo de Reservación';
          const formattedDate = format(new Date(reservationDetails.Fecha), 'EEEE, dd MMMM yyyy', { locale: es });

          const emailText = `
Hola ${Nombre},

La reserva que solicitaste con los siguientes datos ha sido rechazada :(
Si quieres saber los motivos contacta con la administración.
Fecha: ${reservationDetails.Fecha}
Hora de Inicio: ${reservationDetails.HoraInicio}
Hora de Fin: ${reservationDetails.HoraFin}
Sala: ${reservationDetails.idSala ? `Sala ${roomDetails[0].Nombre}` : 'N/A'}
Cubículo: ${reservationDetails.idCubiculo ? `Cubículo ${cubicleDetails[0].Nombre}` : 'N/A'}
Observaciones: ${reservationDetails.Observaciones || 'Ninguna'}
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
        <!-- Detalles de la reservación -->
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Tu reserva se ha rechazado con los siguientes detalles:
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          <strong>Fecha:</strong> ${formattedDate}<br>
          <strong>Hora de Inicio:</strong> ${reservationDetails.HoraInicio}<br>
          <strong>Hora de Fin:</strong> ${reservationDetails.HoraFin}<br>
          ${reservationDetails.idSala ? `<strong>Sala:</strong> ${roomDetails[0].Nombre}<br>` : ''}
          ${reservationDetails.idCubiculo ? `<strong>Cubículo:</strong>  ${cubicleDetails[0].Nombre}<br>` : ''}
          ${reservationDetails.Observaciones ? `<strong>Observaciones:</strong> ${reservationDetails.Observaciones}<br>` : ''} 
          ${reservationDetails.Refrigerio ? '<strong>Refrigerio:</strong> Sí (Según disponibilidad)' : ''}
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
        }
      }
    } catch (error) {
      console.error(error);
      throw new Error();
    }

    return true;
  }




  static async update({ id, input }) {
    const {
      fecha,
      horaInicio,
      horaFin,
      observaciones,
      idRecursos,
      refrigerio,
      estado,
      encuestaCompletada
    } = input;

    try {
      // Verificar conflictos de horaInicio
      const { rows: horaIni } = await pool.query(
          `SELECT "HoraInicio" FROM "reservacion" WHERE "HoraInicio" = $1 AND "Fecha" = $2`,
          [horaInicio, fecha]
      );
      if (horaIni.length > 0) return false;

      // Verificar conflictos de horaFin
      const { rows: horaFinal } = await pool.query(
          `SELECT "HoraFin" FROM "reservacion" WHERE "HoraFin" = $1 AND "Fecha" = $2`,
          [horaFin, fecha]
      );
      if (horaFinal.length > 0) return false;

      // Actualizar la reservación
      const { rowCount } = await pool.query(
          `UPDATE "reservacion"
           SET "Fecha" = COALESCE($1, "Fecha"),
               "HoraInicio" = COALESCE($2, "HoraInicio"),
               "HoraFin" = COALESCE($3, "HoraFin"),
               "Observaciones" = COALESCE($4, "Observaciones"),
               "Refrigerio" = COALESCE($5, "Refrigerio"),
               "Estado" = COALESCE($6, "Estado"),
               "EncuestaCompletada" = COALESCE($7, "EncuestaCompletada")
           WHERE "idReservacion" = $8;`,
          [fecha, horaInicio, horaFin, observaciones, refrigerio, estado, encuestaCompletada, id]
      );
      if (rowCount === 0) throw new Error('No se encontró la reservación con ese id');

      // Actualizar recursos asociados
      if (Array.isArray(idRecursos)) {
        const { rows: currentResources } = await pool.query(
            `SELECT "idRecurso" FROM "reservacion_recursos" WHERE "idReservacion" = $1`,
            [id]
        );
        const currentResourceIds = currentResources.map(r => r.idRecurso);

        const resourcesToDelete = currentResourceIds.filter(r => !idRecursos.includes(r));
        const resourcesToAdd = idRecursos.filter(r => !currentResourceIds.includes(r));

        if (resourcesToDelete.length > 0) {
          await pool.query(
              `DELETE FROM "reservacion_recursos" 
           WHERE "idReservacion" = $1 AND "idRecurso" = ANY($2::int[])`,
              [id, resourcesToDelete]
          );
        }

        for (const idRecurso of resourcesToAdd) {
          await pool.query(
              `INSERT INTO "reservacion_recursos" ("idReservacion", "idRecurso") VALUES ($1, $2)`,
              [id, idRecurso]
          );
        }
      }

      // Enviar email si la reservación fue aceptada
      if (estado) {
        const { rows: reservationInfo } = await pool.query(
            `SELECT "idUsuario", "idSala", "idCubiculo" FROM "reservacion" WHERE "idReservacion" = $1`,
            [id]
        );

        const { idUsuario, idSala, idCubiculo } = reservationInfo[0];

        const { rows: userDetails } = await pool.query(
            `SELECT "Nombre", "CorreoEmail" FROM "usuario" WHERE "CedulaCarnet" = $1`,
            [idUsuario]
        );

        const { rows: cubicleDetails } = await pool.query(
            `SELECT "Nombre" FROM "cubiculo" WHERE "idCubiculo" = $1`,
            [idCubiculo]
        );

        const { rows: roomDetails } = await pool.query(
            `SELECT "Nombre" FROM "sala" WHERE "idSala" = $1`,
            [idSala]
        );

        if (userDetails.length > 0) {
          const { Nombre, CorreoEmail } = userDetails[0];

          const { rows: reservationRows } = await pool.query(
              `SELECT * FROM "reservacion" WHERE "idReservacion" = $1`,
              [id]
          );

          const reservationDetails = reservationRows[0];

          const emailSubject = 'Reserva Aceptada';
          const formattedDate = format(new Date(reservationDetails.Fecha), 'EEEE, dd MMMM yyyy', { locale: es });
          const emailText = `
Hola ${Nombre},

La reserva que solicitaste con los siguientes datos ha sido aceptada!!
Fecha: ${reservationDetails.Fecha}
Hora de Inicio: ${reservationDetails.HoraInicio}
Hora de Fin: ${reservationDetails.HoraFin}
Sala: ${idSala ? `Sala ${roomDetails[0].Nombre}` : 'N/A'}
Cubículo: ${idCubiculo ? `Cubículo ${cubicleDetails[0].Nombre}` : 'N/A'}
Observaciones: ${reservationDetails.Observaciones || 'Ninguna'}
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
        <!-- Detalles de la reservación -->
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Tu reserva se ha aceptado con los siguientes detalles:
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          <strong>Fecha:</strong> ${formattedDate}<br>
          <strong>Hora de Inicio:</strong> ${reservationDetails.HoraInicio}<br>
          <strong>Hora de Fin:</strong> ${reservationDetails.HoraFin}<br>
          ${reservationInfo[0].idSala ? `<strong>Sala:</strong> ${roomDetails[0].Nombre}<br>` : ''}
          ${reservationInfo[0].idCubiculo ? `<strong>Cubículo:</strong>  ${cubicleDetails[0].Nombre}<br>` : ''}
          ${reservationDetails.Observaciones ? `<strong>Observaciones:</strong> ${reservationDetails.observaciones}<br>` : ''} 
          ${reservationDetails.Refrigerio ? '<strong>Refrigerio:</strong> Sí (Según disponibilidad)' : ''}
        </p>
      </td>
    </tr>
  </table>
</div>
`;

          sendEmail(CorreoEmail, emailSubject, emailText, emailHtml);
        }
      }

      return true;
    } catch (error) {
      throw new Error(error);
    }
  }


}