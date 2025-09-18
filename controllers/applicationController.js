import { applicationModel } from '../models/postgresql/applicationModel.js';
import { validateApplication, validateApplicationUpdate } from '../schemas/applicationSchema.js';
import multer from 'multer';
import {userModel} from "../models/postgresql/userModel.js";
import {sendEmail} from "../services/emailService.js";
import {assetModel} from "../models/postgresql/assetModel.js";
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});


const createEmailHtml = (asunto, descripcion) => `
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
                Centro Académico<br>de Alajuela
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px 0;">
          <!-- Asunto -->
          <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${asunto}</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px 0;">
          <!-- Descripción -->
          <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
            ${descripcion}
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

const upload = multer({ storage: storage });

export class applicationController {

    static async getAll(req, res) {
        const applications = await applicationModel.getAll();
        res.json(applications);
    }

    static async getById(req, res) {
        const { id } = req.params;
        const application = await applicationModel.getById({ id });
        if (application) return res.json(application);
        res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    static async getByUserId(req, res) {
        const { userId } = req.params;
        const applications = await applicationModel.getByUserId({ userId });
        if(applications.length > 0) return res.json(applications)
        res.status(404).json({message: 'No hay solicitudes realizadas por este usuario'})
    }

    static create = [
        upload.single('archivoSolicitud'),
        async (req, res) => {

            const idUsuario = parseInt(req.body.idUsuario, 10);
            const idActivo = parseInt(req.body.idActivo, 10);


            const inputForValidation = {
                ...req.body,
                idUsuario,
                idActivo,
                archivoSolicitud: req.file ? req.file.path : undefined
            };


            const result = validateApplication(inputForValidation);
            if (result.success === false) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }


            if (!req.file) {
                return res.status(400).json({ error: 'El archivo PDF es obligatorio' });
            }


            const input = {
                ...req.body,
                idUsuario,
                idActivo,
                archivoSolicitud: req.file.path
            };


            const newApplication = await applicationModel.create({ input });
            if (newApplication === false) {
                return res.status(409).json({ message: 'Dato repetido' });
            }
            res.status(201).json(newApplication);
        }
    ];



    static async delete(req, res) {
        const { id } = req.params;
        const requester = req.user;

        const aplication = await applicationModel.getById({ id });
        if (aplication.Estado === "Pendiente" && parseInt(requester.id) === parseInt(aplication.idUsuario)) {

            const deletedApplication = await applicationModel.delete({id});

            if (deletedApplication === false) {
                return res.status(404).json({message: 'Solicitud no eliminada'});
            }
            res.status(204).json({message: "Se eliminó correctamente la solicitud"});
        }
        else {
            res.status(403).json({message: "No tiene permisos para eliminar esta solicitud"});
        }
    }

    static async update(req, res) {
        const result = validateApplicationUpdate(req.body);
        if (result.success === false) {
            return res.status(400).json({ error: JSON.parse(result.error.message) });
        }

        const { id } = req.params;
        const updatedApplication = await applicationModel.update({ id, input: req.body });
        if (updatedApplication) return res.json(updatedApplication);
        res.status(404).json({ message: 'Solicitud no actualizada' });
    }

    static updateSignApplication = [
        upload.single('archivoSolicitud'),
        async (req, res) => {
            const { id } = req.params;
            const { estado } = req.body;

            try {

                const currentApplication = await applicationModel.getById({id: id });

                if (!currentApplication) {
                    return res.status(404).json({ message: 'Solicitud no encontrada' });
                }


                let newFilePath;
                if (req.file) {

                    const currentFilePath = path.join(__dirname, '..', 'uploads', path.basename(currentApplication.archivoSolicitud));

                    if (fs.existsSync(currentFilePath)) {
                        fs.unlinkSync(currentFilePath);
                    }

                    newFilePath = req.file.path;
                } else {

                    newFilePath = currentApplication.archivoSolicitud;
                }


                const input = {
                    estado,
                    archivoSolicitud: newFilePath
                };

                const updatedApplication = await applicationModel.updateSignApplication({ id, input });

                res.json(updatedApplication);
            } catch (error) {
                console.error("Error al actualizar la solicitud:", error);
                res.status(500).json({ message: 'Error al actualizar la solicitud' });
            }
        }
    ];





    static async sendJustificationEmail(req, res) {
        try {
            const { idSolicitud, idUsuario, justificacion } = req.body;

            if (!idSolicitud || !idUsuario) {
                return res.status(400).json({ message: 'ID de solicitud y ID de usuario son requeridos' });
            }



            // Obtener la solicitud usando `idSolicitud`
            const solicitud = await applicationModel.getById({id: idSolicitud});
            if (!solicitud) {
                return res.status(404).json({ message: 'Solicitud no encontrada' });
            }

            // Obtener el correo del usuario
            const user = await userModel.getById({id: idUsuario});
            if (!user || !user.CorreoEmail) {
                return res.status(404).json({ message: 'Usuario no encontrado o sin correo electrónico registrado' });
            }

            // Obtener los detalles del activo
            const activo = await assetModel.getById({id: solicitud.idActivo});
            if (!activo) {
                return res.status(404).json({ message: 'Activo no encontrado' });
            }



            // Construir asunto y cuerpo del correo basado en la justificación
            let emailSubject;
            let emailDescription;

            if (!justificacion) {
                emailSubject = 'Solicitud Aceptada';
                emailDescription = `
        <div style="padding: 20px; background-color: #f4f4f4;">
            Su solicitud ha sido aceptada. Puede pasar a recoger el activo solicitado en el centro correspondiente.
            <br><br>
            <strong>Detalles de la Solicitud:</strong>
            <div style="text-align: center; margin-top: 10px;">
                <p><strong>ID Solicitud:</strong> ${idSolicitud}</p>
                <p><strong>Activo:</strong> ${activo.Nombre}</p>
                <p><strong>Modelo:</strong> ${activo.Modelo}</p>
                <p><strong>Descripción:</strong> ${activo.Descripcion}</p>
                <p><strong>Fecha de Inicio:</strong> ${new Date(solicitud.FechaInicio).toLocaleDateString()}</p>
                <p><strong>Fecha Fin:</strong> ${new Date(solicitud.FechaFin).toLocaleDateString()}</p>
            </div>
        </div>
    `;
            } else {
                emailSubject = 'Solicitud Rechazada';
                emailDescription = `
        <div style="padding: 20px; background-color: #f4f4f4;">
            Su solicitud ha sido rechazada.
            <br><br>
            <strong>Justificación:</strong> ${justificacion}
            <br><br>
            <strong>Detalles de la Solicitud:</strong>
            <div style="text-align: center; margin-top: 10px;">
                <p><strong>ID Solicitud:</strong> ${idSolicitud}</p>
                <p><strong>Activo:</strong> ${activo.Nombre}</p>
                <p><strong>Modelo:</strong> ${activo.Modelo}</p>
                <p><strong>Descripción:</strong> ${activo.Descripcion}</p>
                <p><strong>Fecha de Inicio:</strong> ${new Date(solicitud.FechaInicio).toLocaleDateString()}</p>
                <p><strong>Fecha Fin:</strong> ${new Date(solicitud.FechaFin).toLocaleDateString()}</p>
            </div>
        </div>
    `;
            }



            // Crear HTML del correo usando un template o directamente
            const emailHtml = createEmailHtml(emailSubject, emailDescription);

            // Enviar el correo
            await sendEmail(
                user.CorreoEmail,
                emailSubject,
                emailDescription,
                emailHtml
            );

            res.json({ message: 'Correo enviado correctamente' });
        } catch (error) {
            console.error('Error al enviar el correo:', error);
            res.status(500).json({ message: 'Error al enviar el correo' });
        }
    }


}
