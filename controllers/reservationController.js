import {reservationModel} from '../models/postgresql/reservationModel.js';
import {validateReservation, validateReservationUpdate} from '../schemas/reservationSchema.js';
import {sendEmail} from "../services/emailService.js";
import {format} from "date-fns";
import {es} from "date-fns/locale";
import { DBConfig } from '../DBConfig.js'
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool(DBConfig);

export class reservationController {

  static async getAll(req, res) {
    const { page = 1, itemsPerPage = 10 } = req.query;
    try {

      const { reservations, totalPages } = await reservationModel.getAll({ page: Number(page), itemsPerPage: Number(itemsPerPage) });
      if (reservations.length > 0) {
        return res.json({ reservations, totalPages });
      }
      res.status(404).json({ message: 'No hay reservaciones' });
    } catch (error) {
      console.error('Error obteniendo las reservaciones:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  static async getAllPendingReservations(req, res) {
    const reservations = await reservationModel.getAllPendingReservations()
    res.json(reservations)
  }
  static async getById(req, res) {
    const {id} = req.params
    const reservation = await reservationModel.getById({id})
    if(reservation) return res.json(reservation)
    res.status(404).json({message: 'Reservación no encontrada'})
  }

  static async getByDate(req, res) {
    try {
      const { date } = req.params;
      const reservations = await reservationModel.getByDate({ date });

      return res.json(reservations.length > 0 ? reservations : []);

    } catch (error) {
      return res.status(500).json({ message: 'Error al consultar las reservaciones', error });
    }
  }


  static async getByRoomId(req, res) {
    const {roomId} = req.params
    const reservations = await reservationModel.getByRoomId({roomId})
    if(reservations.length > 0) return res.json(reservations)
    res.status(404).json({message: 'No hay reservaciones para esta sala'})
  }

  static async getByCubicleId(req, res) {
    const {cubicleId} = req.params
    const reservations = await reservationModel.getByCubicleId({cubicleId})
    if(reservations.length > 0) return res.json(reservations)
    res.status(404).json({message: 'No hay reservaciones para este cubiculo'})
  }

  static async getByYear(req, res) {
    const {year} = req.params
    const reservations = await reservationModel.getByYear({year})
    if(reservations.length > 0) return res.json(reservations)
    res.status(404).json({message: 'No hay reservaciones para el año seleccionado'})
  }

  static async getByMonth(req, res) {
    const {year, month} = req.params
    const reservations = await reservationModel.getByMonth({year, month})
    if(reservations.length > 0) return res.json(reservations)
    res.status(404).json({message: 'No hay reservaciones para el mes seleccionado'})
  }

  static async getByDateRange(req, res) {
    const {startDate, endDate} = req.query
    const reservations = await reservationModel.getByDateRange({startDate, endDate})
    if(reservations.length > 0) return res.json(reservations)
    res.status(404).json({message: 'No hay reservaciones en el rango de fechas seleccionado'})
  }

  static async getByUserId(req, res) {
    const { userId } = req.params;
    const { page = 1, itemsPerPage = 10 } = req.query; // Extrae page y itemsPerPage desde query params

    if (!userId) {
      return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }

    try {

      const { reservations, totalPages } = await reservationModel.getByUserId({ userId, page: Number(page), itemsPerPage: Number(itemsPerPage) });
      if (reservations.length > 0) {
        return res.json({ reservations, totalPages });
      }
      res.status(404).json({ message: 'No hay reservaciones asignadas a este usuario' });
    } catch (error) {
      console.error('Error obteniendo las reservaciones:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
  static async getByUserIdComplete(req, res) {
    const {id} = req.params;
    const reservations = await reservationModel.getByUserIdCompleted({id})
    if(reservations.length > 0) return res.json(reservations)
    res.status(404).json({message: 'No hay reservaciones con encuesta faltante'})
  }




  static async create(req, res) {
    const result = validateReservation(req.body)
    if (result.success === false) {
      return res.status(400).json({error: JSON.parse(result.error.message)})
    }
    const newReservation= await reservationModel.create({input: req.body})
    if(newReservation === false) return res.status(409).json({message: 'Dato repetido'})
    res.status(201).json(newReservation)
  }

  static async delete(req, res) {
    const {id} = req.params;
    const requester = req.user;

    const reservation = await reservationModel.getById({id});

    if(reservation.HoraFin < new Date().toISOString() && reservation.Fecha < new Date().toISOString().split('T')[0]) {
      return res.status(400).json({ message: 'No se puede eliminar una reservación que ya ha finalizado' });
    }

    if (requester.id !== reservation.idUsuario && !['Administrador', 'AdministradorReservaciones'].includes(requester.role)) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reservación' });
    }

    const deletedReservation = await reservationModel.delete({id})

    if(deletedReservation === false) return res.status(404).json({message: 'Reservación no eliminada'})
    res.status(204).json({message: "Se elimino correctamente la reservación"})
  }

  static async deleteByDate(req, res) {
    const {date} = req.params
    const deletedReservation = await reservationModel.deleteByDate({date})

    if(deletedReservation === false) return res.status(404).json({message: 'Reservación no eliminada'})
    res.status(204).json({message: "Se elimino correctamente la reservación"})
  }

  static async update(req, res) {
    const result = validateReservationUpdate(req.body)
    if (result.success === false) {
      return res.status(400).json({error: JSON.parse(result.error.message)})
    }

    const {id} = req.params;
    const requester = req.user;

    const reservation = await reservationModel.getById({id});

    if(reservation.HoraFin < new Date().toISOString() && reservation.Fecha < new Date().toISOString().split('T')[0]) {
        return res.status(400).json({ message: 'No se puede editar una reservación que ya ha finalizado' });
    }

    if (requester.id !== reservation.idUsuario && !['Administrador', 'AdministradorReservaciones'].includes(requester.role)) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta reservación' });
    }
    const updatedReservation = await reservationModel.update({id, input: req.body})
    if(updatedReservation ) return res.json(updatedReservation)
    res.status(404).json({message: 'Reservación no actualizada'})
  }
  static async shareReservation(req, res) {
    try {
      const { correosDestinatarios, nombreRemitente, reservationDetails, observaciones, idSala, idCubiculo, refrigerio } = req.body;

      // Verificar que todos los campos requeridos están presentes
      if (!correosDestinatarios || !Array.isArray(correosDestinatarios) || correosDestinatarios.length === 0 || !nombreRemitente || !reservationDetails || !reservationDetails.Fecha || !reservationDetails.HoraInicio || !reservationDetails.HoraFin) {
        return res.status(400).json({ message: 'Todos los campos son requeridos y deben ser válidos' });
      }

      const{ rows: cubicleDetails } = await pool.query(
          'SELECT "Nombre" FROM cubiculo WHERE "idCubiculo" = $1',
          [idCubiculo]
      );

      const{ rows: roomDetails} = await pool.query(
          'SELECT "Nombre" FROM sala WHERE "idSala" = $1',
          [idSala]
      );

      const emailSubject = 'Invitación a Reunión';
      const emailText = `
            Hola,

            ${nombreRemitente} te ha invitado a una reunión con los siguientes detalles:
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
                                ${nombreRemitente} te ha invitado a una reunión con los siguientes detalles:
                            </p>
                            <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
                                <strong>Fecha:</strong> ${formattedDate}<br>
                                <strong>Hora de Inicio:</strong> ${reservationDetails.HoraInicio}<br>
                                <strong>Hora de Fin:</strong> ${reservationDetails.HoraFin}<br>
                                ${idSala ? `<strong>Sala:</strong> ${roomDetails[0].Nombre}<br>` : ''}
                                ${idCubiculo ? `<strong>Cubículo:</strong> ${cubicleDetails[0].Nombre}<br>` : ''}
                                <strong>Observaciones:</strong> ${observaciones || 'Ninguna'}<br>
                                ${refrigerio ? '<strong>Refrigerio:</strong> Sí (Según disponibilidad)' : ''}
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        `;

      // Iterar sobre la lista de correos y enviar el correo a cada destinatario
      for (const correoDestinatario of correosDestinatarios) {
        await sendEmail(
            correoDestinatario,  // Correo destinatario
            emailSubject,        // Asunto del correo
            emailText,           // Texto plano del correo
            emailHtml            // HTML del correo
        );
      }

      // Responder con éxito
      res.json({ message: 'Correos enviados correctamente' });

    } catch (error) {
      // Manejo de errores
      console.error(error);
      res.status(500).json({ message: 'Error al enviar los correos' });
    }
  }
  static async getReservationsByCubicleIdAndWeek(req, res) {
    try {

      const { cubicleId } = req.params;
      const { startDate, endDate } = req.query;


      if (!cubicleId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Cubículo, fecha de inicio y fecha de fin son requeridos' });
      }


      const reservations = await reservationModel.getReservationsByCubicleIdAndWeek({ cubicleId, startDate, endDate });


      if (reservations.length === 0) {
        return res.status(404).json({ message: 'No hay reservaciones para este cubículo en el rango de fechas especificado' });
      }


      return res.json(reservations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al obtener las reservaciones' });
    }
  }
  static async getReservationsByRoomIdAndWeek(req, res) {
    try {
      const { roomId } = req.params;
      const { startDate, endDate } = req.query;

      if (!roomId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Sala, fecha de inicio y fecha de fin son requeridos' });
      }

      const reservations = await reservationModel.getReservationsByRoomIdAndWeek({ roomId, startDate, endDate });

      if (reservations.length === 0) {
        return res.status(404).json({ message: 'No hay reservaciones para esta sala en el rango de fechas especificado' });
      }

      return res.json(reservations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al obtener las reservaciones' });
    }
  }



}
