import mysql from 'mysql2/promise'
import { DBConfig } from '../../DBConfig.js'
import {sendEmail} from "../../services/emailService.js";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const connection = await mysql.createConnection(DBConfig)

export class reservationModel {

  static async getAll ({page = 1, itemsPerPage=10}) {
    const offset = (page - 1) * itemsPerPage;


    // Contar el número total de reservaciones
    const [totalCountResult] = await connection.query(
        `SELECT COUNT(*) as total 
         FROM reservacion 
         WHERE Estado = 1;`,

    );

    const totalReservations = totalCountResult[0].total;
    const totalPages = Math.ceil(totalReservations / itemsPerPage);

    // Obtener las reservaciones paginadas
    const [reservations] = await connection.query(
        ` SELECT
              r.idReservacion,
              r.Fecha,
              r.HoraInicio,
              r.HoraFin,
              r.idSala,
              r.idCubiculo,
              r.idUsuario,
              r.EncuestaCompletada,
              r.Observaciones,
              r.Refrigerio,
              IF(
                      SUM(CASE WHEN rec.idRecursos IS NULL THEN 0 ELSE 1 END) = 0,
                      JSON_ARRAY(),
                      JSON_ARRAYAGG(
                              JSON_OBJECT(
                                      'idRecurso', rec.idRecursos,
                                      'NombreRecurso', rec.Nombre
                              )
                      )
              ) AS recursos
          FROM reservacion r
                   LEFT JOIN reservacion_recursos rr
                             ON r.idReservacion = rr.idReservacion
                   LEFT JOIN recursos rec
                             ON rr.idRecurso = rec.idRecursos
          WHERE r.Estado = 1
          GROUP BY r.idReservacion
          ORDER BY
              CASE
                  WHEN TIMESTAMP(r.Fecha, r.HoraInicio) >= NOW() THEN 0
              ELSE 1
        END,
      CASE
          WHEN TIMESTAMP(r.Fecha, r.HoraInicio) >= NOW()
          THEN TIMESTAMP(r.Fecha, r.HoraInicio)
        END ASC,
      CASE
          WHEN TIMESTAMP(r.Fecha, r.HoraInicio) < NOW()
          THEN TIMESTAMP(r.Fecha, r.HoraInicio)
        END DESC
  LIMIT ? OFFSET ?;`,
        [itemsPerPage, offset]
    );

    if (reservations.length === 0) {
      return {
        reservations: [],
        totalPages: 0
      };
    }

    return {
      reservations: reservations,
      totalPages,
      totalReservations:  totalCountResult[0].total
    };
  }

  static async getAllPendingReservations () {
    const [reservations] = await connection.query(
      ` SELECT 
    r.idReservacion,
    r.Fecha,
    r.HoraInicio,
    r.HoraFin,
    r.idSala,
    r.idCubiculo,
    r.idUsuario,
    r.Observaciones,
    r.Refrigerio,
    rr.idRecurso,
    rec.nombre AS NombreRecurso
    FROM 
        reservacion r
    LEFT JOIN 
        reservacion_recursos rr ON r.idReservacion = rr.idReservacion
    LEFT JOIN 
        recursos rec ON rr.idRecurso = rec.idRecursos
    WHERE r.Estado = 0;`
    )

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
    const [resources] = await connection.query(
      `SELECT 
        r.idReservacion,
        r.Fecha,
        r.HoraInicio,
        r.HoraFin,
        r.idSala,
        r.idCubiculo,
        r.idUsuario,
        rr.idRecurso,
        rec.nombre AS NombreRecurso
     FROM 
        reservacion r 
     LEFT JOIN 
        reservacion_recursos rr ON r.idReservacion = rr.idReservacion
     LEFT JOIN 
        recursos rec ON rr.idRecurso = rec.idRecursos
     WHERE 
        r.idReservacion = ?;`,
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
      recursos: resources.map((row) => ({
        idRecurso: row.idRecurso,
        NombreRecurso: row.NombreRecurso,
      })).filter(recurso => recurso.idRecurso !== null)
    };

    return reservacion;
  }


  static async getByDate({ date }) {

    const [reservations] = await connection.query(
      ` SELECT 
        *
    FROM 
        reservacion r
    WHERE 
        r.Fecha = ?;`,
      [date]
    )

    return reservations
  }

  static async getByRoomId({ roomId }) {

    const [reservations] = await connection.query(
      ` SELECT 
        r.idReservacion,
        r.Fecha,
        r.HoraInicio,
        r.HoraFin,
        r.idSala,
        r.idCubiculo,
        r.idUsuario,
        rr.idRecurso,
        rec.nombre AS NombreRecurso
    FROM 
        reservacion r
    LEFT JOIN 
        reservacion_recursos rr ON r.idReservacion = rr.idReservacion
    LEFT JOIN 
        recursos rec ON rr.idRecurso = rec.idRecursos
    WHERE 
        r.idSala = ?;`,
      [roomId]
    )

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
    const [reservations] = await connection.query(
        ` SELECT 
        r.idReservacion,
        r.Fecha,
        r.HoraInicio,
        r.HoraFin,
        r.idSala,
        r.idCubiculo,
        r.idUsuario,
        rr.idRecurso,
        rec.nombre AS NombreRecurso
      FROM 
        reservacion r
      LEFT JOIN 
        reservacion_recursos rr ON r.idReservacion = rr.idReservacion
      LEFT JOIN 
        recursos rec ON rr.idRecurso = rec.idRecursos
      WHERE 
        r.idCubiculo = ? AND r.Fecha BETWEEN ? AND ?;`,
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
    const [reservations] = await connection.query(
        ` SELECT 
            r.idReservacion,
            r.Fecha,
            r.HoraInicio,
            r.HoraFin,
            r.idSala,
            r.idCubiculo,
            r.idUsuario,
            rr.idRecurso,
            rec.nombre AS NombreRecurso
        FROM 
            reservacion r
        LEFT JOIN 
            reservacion_recursos rr ON r.idReservacion = rr.idReservacion
        LEFT JOIN 
            recursos rec ON rr.idRecurso = rec.idRecursos
        WHERE 
            r.idSala = ? AND r.Fecha BETWEEN ? AND ?;`,
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
    const [reservations] = await connection.query(
      ` SELECT 
        *
    FROM 
        reservacion 
    WHERE 
        idCubiculo = ?;`,
      [cubicleId]
    )


    return reservations;
  }

  static async getByYear({ year }) {
    const [reservations] = await connection.query(
      ` SELECT 
        *
    FROM 
        reservacion 
    WHERE 
        YEAR(Fecha) = ?;`,
      [year]
    )

    return reservations
  }

  static async getByMonth({ year, month }) {
    const [reservations] = await connection.query(
      'SELECT * FROM reservacion WHERE YEAR(Fecha) = ? AND MONTH(Fecha) = ?',
      [year, month])

    return reservations
  }

  static async getByDateRange({ startDate, endDate }) {
    const [reservations] = await connection.query(
      ` SELECT 
        *
    FROM 
        reservacion 
    WHERE 
        Fecha BETWEEN ? AND ?;`,
      [startDate, endDate]
    )

    return reservations
  }


  static async getByUserIdCompleted({ id }) {
    const [reservations] = await connection.query(
      ` SELECT 
        *
    FROM 
        reservacion 
    WHERE 
        idUsuario = ? AND EncuestaCompletada = 0;`,

      [id]
    )

    return reservations
  }

  static async getByUserId({ userId, page = 1, itemsPerPage=10 }) {
    const offset = (page - 1) * itemsPerPage;


    // Contar el número total de reservaciones
    const [totalCountResult] = await connection.query(
        `SELECT COUNT(*) as total 
         FROM reservacion 
         WHERE Estado = 1 AND idUsuario = ?;`,
        [userId]
    );

    const totalReservations = totalCountResult[0].total;
    const totalPages = Math.ceil(totalReservations / itemsPerPage);

    // Obtener las reservaciones paginadas
    const [reservations] = await connection.query(
        `SELECT
             r.idReservacion,
             r.Fecha,
             r.HoraInicio,
             r.HoraFin,
             r.idSala,
             r.idCubiculo,
             r.idUsuario,
             r.EncuestaCompletada,
             r.Observaciones,
             r.Refrigerio,
             IF(
                     SUM(CASE WHEN rec.idRecursos IS NULL THEN 0 ELSE 1 END) = 0,
                     JSON_ARRAY(),
                     JSON_ARRAYAGG(
                             JSON_OBJECT(
                                     'idRecurso', rec.idRecursos,
                                     'NombreRecurso', rec.Nombre
                             )
                     )
             ) AS recursos
         FROM reservacion r
                  LEFT JOIN reservacion_recursos rr
                            ON r.idReservacion = rr.idReservacion
                  LEFT JOIN recursos rec
                            ON rr.idRecurso = rec.idRecursos
         WHERE r.Estado = 1
           AND r.idUsuario = ?
         GROUP BY r.idReservacion
         ORDER BY
             CASE
                 WHEN TIMESTAMP(r.Fecha, r.HoraInicio) >= NOW() THEN 0
             ELSE 1
        END,
      CASE
          WHEN TIMESTAMP(r.Fecha, r.HoraInicio) >= NOW()
          THEN TIMESTAMP(r.Fecha, r.HoraInicio)
        END ASC,
      CASE
          WHEN TIMESTAMP(r.Fecha, r.HoraInicio) < NOW()
          THEN TIMESTAMP(r.Fecha, r.HoraInicio)
        END DESC
  LIMIT ? OFFSET ?;`,
        [userId, itemsPerPage, offset]
    );

    if (reservations.length === 0) {
      return {
        reservations: [],
        totalPages: 0
      };
    }


    return {
      reservations: reservations,
      totalPages
    };
  }









  static async create ({ input }) {
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
    } = input

    try {

                    if ((!idSala && !idCubiculo) || (idSala && idCubiculo)) {
                        throw new Error ('Debes seleccionar una sala O un cubículo (solo uno).');
                    }
                    if (!horaInicio || !horaFin) throw new Error ('Faltan horaInicio/horaFin.');
                    if (horaInicio >= horaFin) throw new Error ('La hora de fin debe ser mayor que la de inicio.');


                    const esSala = !!idSala;
                    const espacioWhere = esSala ? 'idSala = ?' : 'idCubiculo = ?';
                    const espacioId = esSala ? idSala : idCubiculo;

                    const [conflicts] = await connection.query(

                        `SELECT idReservacion, HoraInicio, HoraFin
                            FROM reservacion
                            WHERE Fecha = ?
                            AND ${espacioWhere}
                            AND Estado = 1
                            AND (HoraInicio < ? AND HoraFin > ?)
                            FOR UPDATE`, [fecha,espacioId,horaFin,horaInicio]

                    )

                    if (conflicts.length > 0) {
                        const c = conflicts[0];
                        throw new Error(`Ya existe una reservación en esa fecha y espacio.`);
                    }



                  const [result] = await connection.query(
                    'INSERT INTO reservacion (Fecha,HoraInicio,HoraFin,idSala,idCubiculo,idUsuario,Observaciones,Refrigerio, Estado, EncuestaCompletada) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [fecha, horaInicio, horaFin, idSala, idCubiculo, idUsuario, observaciones, refrigerio, estado, encuestaCompletada]
                  )

                  const [userDetails] = await connection.query(
                      'SELECT Nombre, CorreoEmail FROM Usuario WHERE CedulaCarnet = ?',
                      [idUsuario]
                  );


                  const[cubicleDetails] = await connection.query(
                      'SELECT Nombre FROM Cubiculo WHERE idCubiculo = ?',
                      [idCubiculo]
                    );



                  const[roomDetails] = await connection.query(
                        'SELECT Nombre FROM Sala WHERE idSala = ?',
                        [idSala]
                    );

                  if (userDetails.length > 0 && estado) {


                    const { Nombre, CorreoEmail } = userDetails[0];


                    const [reservation] = await connection.query(
                        `SELECT *
                     FROM reservacion WHERE idReservacion = LAST_INSERT_ID();`
                    );


                    const reservationDetails = reservation[0];
                    const emailSubject = 'Confirmación de Reservación';
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

                    const formattedDate = format(new Date(reservationDetails.Fecha), 'EEEE, dd MMMM yyyy', { locale: es });

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

                    sendEmail(
                        CorreoEmail,
                        emailSubject,
                        emailText,
                        emailHtml
                    );
                  }




                  if (Array.isArray(idRecursos) && idRecursos.length > 0) {
                    const insertPromises = idRecursos.map(idRecurso => {
                      return connection.query(
                        'INSERT INTO reservacion_recursos (idReservacion, idRecurso) VALUES (?, ?)',
                        [result.insertId, idRecurso]
                      );
                    });
                    await Promise.all(insertPromises);
                  }
    }

    catch (error) {
      return error.message;
    }

    const [reservation] = await connection.query(
      `SELECT *
             FROM reservacion WHERE idReservacion = LAST_INSERT_ID();`
    )
    return reservation[0]
  }

  static async deleteByDate({ date }) {


    try {
      const [reservations] = await connection.query(
          'SELECT * FROM reservacion WHERE Fecha = ?;', [date]
      );

      for (const reservation of reservations) {
        await connection.query(
            'DELETE FROM reservacion_recursos WHERE idReservacion = ?',
            [reservation.idReservacion]
        );
      }

      await connection.query(
          'DELETE FROM reservacion r WHERE r.Fecha = ?;',
          [date]
      );
    }
    catch (error) {
      throw new Error(error)
    }
    return true
  }

  static async delete ({ id }) {
    try {

      const [reservation] = await connection.query(
        'SELECT * FROM reservacion WHERE idReservacion = ?;', [id]
      );

      await connection.query(
        'DELETE FROM reservacion_recursos WHERE idReservacion = ?',
        [id]
      );
      await connection.query(
        'DELETE FROM reservacion WHERE idReservacion = ?',
        [id]
      );

      if(reservation[0].Estado === 0){

        const reservDe = reservation[0];
        const [userDetails] = await connection.query(
          'SELECT Nombre, CorreoEmail FROM Usuario WHERE CedulaCarnet = ?',
          [reservation[0].idUsuario]
        );


        const[cubicleDetails] = await connection.query(
          'SELECT Nombre FROM Cubiculo WHERE idCubiculo = ?',
          [reservation[0].idCubiculo]
        );



        const[roomDetails] = await connection.query(
          'SELECT Nombre FROM Sala WHERE idSala = ?',
          [reservation[0].idSala]
        );

        if (userDetails.length > 0) {


          const { Nombre, CorreoEmail } = userDetails[0];


          const [reservation] = await connection.query(
            `SELECT *
         FROM reservacion WHERE idReservacion = ?;`, [id]
          );


          const reservationDetails = reservDe;
          const emailSubject = 'Rechazo de Reservación';
          const emailText = `
      Hola ${Nombre},
      
      La reserva que solicitaste con los siguiente datos a sido rechazada :(
      Si quieres saber los motivos contacta con la administración.
      Fecha: ${reservationDetails.Fecha}
      Hora de Inicio: ${reservationDetails.HoraInicio}
      Hora de Fin: ${reservationDetails.HoraFin}
      Sala: ${reservationDetails.idSala ? `Sala ${roomDetails[0].Nombre}` : 'N/A'}
      Cubículo: ${reservationDetails.idCubiculo ? `Cubículo ${cubicleDetails[0].Nombre}` : 'N/A'}
      Observaciones: ${reservationDetails.Observaciones || 'Ninguna'}
    `;

          const formattedDate = format(new Date(reservationDetails.Fecha), 'EEEE, dd MMMM yyyy', { locale: es });

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


    }
    catch (error) {
      console.error(error)
      throw new Error()
    }
    return true
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
    } = input
    try {

      const [horaIni] = await connection.query(
        'SELECT HoraInicio FROM reservacion WHERE HoraInicio = ? AND Fecha = ?',
        [horaInicio, fecha]
      )

      if (horaIni.length > 0) {
        console.log("1")
        return false
      }

      const [horaFinal] = await connection.query(
        'SELECT HoraFin FROM reservacion WHERE HoraFin = ? AND Fecha = ?',
        [horaFin, fecha]
      )

      if (horaFinal.length > 0) {
        console.log("2")
        return false
      }

      const [result] = await connection.query(
        `UPDATE reservacion
           SET Fecha = COALESCE(?, Fecha),
           HoraInicio = COALESCE(?, HoraInicio),
           HoraFin = COALESCE(?, HoraFin),
           Observaciones = COALESCE(?, Observaciones),
           Refrigerio = COALESCE(?, Refrigerio),
           Estado = COALESCE(?, Estado),
           EncuestaCompletada = COALESCE(?, EncuestaCompletada)
           WHERE idReservacion = ?;`,
        [fecha, horaInicio,horaFin, observaciones,refrigerio,estado, encuestaCompletada, id]
      );
      if (result.affectedRows === 0) {
        throw new Error('No se encontro la reservacion con ese id');
      }


      const [currentResources] = await connection.query(
        `SELECT idRecurso FROM reservacion_recursos WHERE idReservacion = ?;`,
        [id]
      );

      const currentResourceIds = currentResources.map((resource) => resource.idRecurso);

      if (idRecursos && Array.isArray(idRecursos)) {
        const resourcesToDelete = currentResourceIds.filter(
          (idRecurso) => !idRecursos.includes(idRecurso)
        );

        const resourcesToAdd = idRecursos.filter(
          (idRecurso) => !currentResourceIds.includes(idRecurso)
        );

        if (resourcesToDelete.length > 0) {
          await connection.query(
            `DELETE FROM reservacion_recursos WHERE idReservacion = ? AND idRecurso IN (?);`,
            [id, resourcesToDelete]
          );
        }

        if (resourcesToAdd.length > 0) {
          const insertPromises = resourcesToAdd.map((idRecurso) => {
            return connection.query(
              `INSERT INTO reservacion_recursos (idReservacion, idRecurso) VALUES (?, ?);`,
              [id, idRecurso]
            );
          });

          await Promise.all(insertPromises);
        }
      }

      if(estado){

        const [reservationInfo] = await connection.query(
          `SELECT idUsuario, idSala, idCubiculo FROM reservacion WHERE idReservacion = ?;`,
          [id]
        );

        const [userDetails] = await connection.query(
          'SELECT Nombre, CorreoEmail FROM Usuario WHERE CedulaCarnet = ?;',
          [reservationInfo[0].idUsuario]
        );

        const[cubicleDetails] = await connection.query(
          'SELECT Nombre FROM Cubiculo WHERE idCubiculo = ?',
          [reservationInfo[0].idCubiculo]
        );

        const[roomDetails] = await connection.query(
          'SELECT Nombre FROM Sala WHERE idSala = ?',
          [reservationInfo[0].idSala]
        );



        if (userDetails.length > 0) {
          const { Nombre, CorreoEmail } = userDetails[0];


          const [reservation] = await connection.query(
            `SELECT *
         FROM reservacion WHERE idReservacion = ?;`,[id]
          );


          const reservationDetails = reservation[0];
          const emailSubject = 'Reserva Aceptada';
          const emailText = `
      Hola ${Nombre},
      
      La reserva que solicitaste con los siguiente datos a sido aceptada!!
      Fecha: ${reservationDetails.Fecha}
      Hora de Inicio: ${reservationDetails.HoraInicio}
      Hora de Fin: ${reservationDetails.HoraFin}
      Sala: ${reservationInfo[0].idSala ? `Sala ${roomDetails[0].Nombre}` : 'N/A'}
      Cubículo: ${reservationInfo[0].idCubiculo ? `Cubículo ${cubicleDetails[0].Nombre}` : 'N/A'}
      Observaciones: ${reservationDetails.Observaciones || 'Ninguna'}
    `;

          const formattedDate = format(new Date(reservationDetails.Fecha), 'EEEE, dd MMMM yyyy', { locale: es });

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

          sendEmail(
            CorreoEmail,
            emailSubject,
            emailText,
            emailHtml
          );
        }


      }

      return 1;
    } catch (error) {
      throw new Error(error);
    }
  }

}