import { sendEmail } from './emailService.js';
import moment from 'moment-timezone';
import { format } from "date-fns";
import { es } from "date-fns/locale";




export function createNotificationService({
                                              reservationModel,
                                              userModel,
                                              roomModel,
                                              cubicleModel,
                                              timezone = 'America/Costa_Rica'
                                          }) {
    if (!reservationModel || !userModel || !sendEmail) {
        throw new Error('Faltan dependencias requeridas para notificationService.');
    }

    return async function run() {
        const threeDaysFromNow = moment().tz(timezone).add(3, 'days').format('YYYY-MM-DD');
        try {
            const upcomingReservations = await reservationModel.getByDate({date: threeDaysFromNow});

            if (upcomingReservations.length > 0) {
                for (const reservation of upcomingReservations) {
                    const user = await userModel.getById({id: reservation.idUsuario});
                    const room = await roomModel.getNameById({id: reservation.idSala});
                    const cubicle = await cubicleModel.getById({id: reservation.idCubiculo});

                    if (user) {
                        const emailSubject = 'Recordatorio de Reservación';
                        const formattedDate = format(new Date(reservation.Fecha), 'EEEE, dd MMMM yyyy', {locale: es});

                        const emailText = `
                    Hola ${user.Nombre}, este es un recordatorio de que usted tiene una reunión agendada en 3 días.
                    
                    Fecha: ${formattedDate}
                    Hora de Inicio: ${reservation.HoraInicio}
                    Hora de Fin: ${reservation.HoraFin}
                    Sala: ${room ? `Sala ${room.Nombre}` : 'N/A'}
                    Cubículo: ${cubicle ? `Cubículo ${cubicle.Nombre}` : 'N/A'}
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
                            <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${emailSubject}</h1>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding: 10px 0;">
                            <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
                              Hola ${user.Nombre}, este es un recordatorio de que usted tiene una reunión agendada en 3 días.
                            </p>
                            <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
                              <strong>Fecha:</strong> ${formattedDate}<br>
                              <strong>Hora de Inicio:</strong> ${reservation.HoraInicio}<br>
                              <strong>Hora de Fin:</strong> ${reservation.HoraFin}<br>
                              ${room ? `<strong>Sala:</strong> ${room.Nombre}<br>` : ''}
                              ${cubicle ? `<strong>Cubículo:</strong>  ${cubicle.Nombre}<br>` : ''}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    `;

                        sendEmail(
                            user.CorreoEmail,
                            emailSubject,
                            emailText,
                            emailHtml
                        );
                    } else {
                        console.error(`No se encontró el usuario con ID ${reservation.idUsuario}`);
                    }
                }
            } else {
                console.log('No hay reservaciones a 3 días de realizarse.');
            }
        } catch (error) {
            console.error('Error al revisar las reservaciones:', error);
        }
    };
}
