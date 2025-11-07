import {validateUser, validateUserUpdate} from '../schemas/userSchema.js';
import jwt from 'jsonwebtoken';
import {sendEmail} from "../services/emailService.js";
import dotenv from 'dotenv';
dotenv.config();


export class UserController {

    constructor({userModel, roleModel}) {
        this.userModel = userModel
        this.roleModel = roleModel
    }

     getAll = async (req, res) =>{
        const users = await this.userModel.getAll()
        res.json(users)
    }
     getById = async (req, res) =>{
        try {
            const { id } = req.params;
            const requester = req.user;


            if (requester.role === "Administrador" || requester.role === "AdministradorReservaciones") {
                const user = await this.userModel.getById({id});
                return res.json(user);
            }


            if (parseInt(requester.id) !== parseInt(id)) {
                return res.status(403).json({ message: "No tienes permiso para ver este usuario" });
            }

            const user = await this.userModel.getById({id});
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error al obtener el usuario" });
        }
    }


     create = async (req, res) =>{
        const result = validateUser(req.body);
        if (!result.success) {
            return res.status(400).json({ message: JSON.parse(result.error.message) });
        }

        const role = await this.roleModel.getById({ id: req.body.idRol });
        if (!role) {
            return res.status(400).json({ message: "Rol no válido" });
        }

        const newUser = await this.userModel.create({ input: req.body });

        if (typeof newUser === "string") {
            return res.status(409).json({ message: newUser });
        }

        res.status(201).json(newUser);
    }

     register = async (req, res) =>{


        const result = validateUser(req.body);
        if (!result.success) {
            return res.status(400).json({ message: JSON.parse(result.error.message) });
        }


        const role = await this.roleModel.getById({ id: req.body.idRol });

        if (!role) {
            return res.status(400).json({ message: "Rol no válido" });
        }


        const allowedRoles = ["Estudiante", "Profesor"];
        if (!allowedRoles.includes(role.nombre)) {
            return res.status(403).json({ message: "No tienes permisos para registrarte con este rol" });
        }

        const newUser = await this.userModel.create({input: req.body });

        if (typeof newUser === "string") {
            return res.status(409).json({ message: newUser });
        }

        res.status(201).json(newUser);
    }


     delete = async (req, res) =>{
        const {id} = req.params
        const deletedUser = await this.userModel.delete({id})

        if(deletedUser === false) return res.status(404).json({message: 'Usuario no eliminado'})
        res.status(204).json({message: "Se elimino correctamente el usuario"})
    }

     update = async (req, res) =>{
        const result = validateUserUpdate(req.body);
        if (result.success === false) {
            return res.status(400).json({ error: JSON.parse(result.error.message) });
        }

        const { id } = req.params;
        const requester = req.user;
        if (parseInt(requester.id) === parseInt(id)) {

            if (req.body.idRol !== undefined || req.body.estado !== undefined) {
                return res.status(403).json({ message: "No puedes modificar tu rol ni tu estado" });
            }

            const updatedUser = await this.userModel.update({ id, input: req.body });
            if (typeof updatedUser === "string") {
                return res.status(409).json({ message: updatedUser });
            }
            return res.json({ message: "Usuario actualizado correctamente" });
        }


        if (["Administrador", "AdministradorReservaciones"].includes(requester.role)) {

            const { idRol, estado } = req.body;
            const allowedUpdates = {};

            if (idRol !== undefined) allowedUpdates.idRol = idRol;
            if (estado !== undefined) allowedUpdates.estado = estado;

            if (Object.keys(allowedUpdates).length === 0) {
                return res.status(400).json({ message: "Solo puedes actualizar rol o estado de otros usuarios" });
            }

            const updatedUser = await this.userModel.update({ id, input: allowedUpdates });
            if (typeof updatedUser === "string") {
                return res.status(409).json({ message: updatedUser });
            }
            return res.json({ message: "Usuario actualizado correctamente" });
        }

        return res.status(403).json({ message: "No tienes permisos para actualizar este usuario" });
    }

     login = async (req, res) =>{

        const user = await this.userModel.login({input: req.body})

        if(!user) return res.status(409).json({message: 'Credenciales incorrectas'})

        if(user.Estado === true){
            return res.status(403).json({message: 'Su cuenta se encuentra bloqueada, comuniquese con la administración'})
        }
        else{

            const token = jwt.sign({id: user.CedulaCarnet,role:user.RolNombre}, process.env.JWT_SECRET, {expiresIn: '1d'})
            return res.json({token})
        }

    }

     sendAllEmail = async (req, res) =>{
        try {

            const { asunto, descripcion } = req.body;


            if (!asunto || !descripcion) {
                return res.status(400).json({ message: 'Asunto y descripción son requeridos' });
            }


            const emails = await this.userModel.getAllEmails();


            for (let i = 0; i < emails.length; i++) {
                const { CorreoEmail } = emails[i];


                const emailSubject = asunto;
                const emailText = descripcion;
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









                // Enviar el correo electrónico
                await sendEmail(
                    CorreoEmail,  // Correo del usuario actual en la iteración
                    emailSubject,  // Asunto del correo
                    emailText,     // Texto plano del correo
                    emailHtml      // HTML del correo
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

     updatePassword = async (req, res) =>{

        const { id } = req.params;
        const updatedUser = await this.userModel.updatePassword({ id });


        if (typeof updatedUser === 'string') {

            return res.status(409).json({ message: updatedUser });
        }


        return res.json({ message: 'Usuario actualizado correctamente' });
    }


     sendAdminEmails = async (req, res) =>{
        try {
            const { cedulaCarnet, nombre, correoEmail } = req.body;


            if (!cedulaCarnet || !nombre || !correoEmail) {
                return res.status(400).json({ message: 'Cédula, nombre y correo son requeridos' });
            }


            const users = await this.userModel.getAll();


            const admins = users.filter(user =>
                user.NombreRol === 'AdministradorReservaciones' || user.NombreRol === 'Administrador'
            );

            if (admins.length === 0) {
                return res.status(404).json({ message: 'No hay administradores disponibles para enviar correos' });
            }


            for (let i = 0; i < admins.length; i++) {
                const { CorreoEmail, Nombre: adminName } = admins[i];

                const emailSubject = 'Solicitud de verificación de rol para Profesor';
                const emailText = `
                    Estimado/a ${adminName},

                    La persona con los siguientes detalles ha solicitado acceso a las funciones de profesor:

                    - Cédula/Carnet: ${cedulaCarnet}
                    - Nombre: ${nombre}
                    - Correo: ${correoEmail}

                    Por favor, verifique que la información del usuario corresponde a un profesor y, si es correcto, diríjase a la administración de usuarios para cambiar su rol a 'Profesor'.

                    Atentamente,
                    El sistema de administración
                `;
                const emailHtml = `
<div style="padding: 20px; background-color: #f4f4f4;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" style="text-align: center;">
          <tr>
            <td style="background-color: #ffffff; padding: 10px 20px; color: #000000; font-family: 'Georgia', serif; font-size: 36px; font-weight: bold;">
              TEC
            </td>
            <td style="width: 5px; background-color: #c1272d;"></td>
            <td style="background-color: #ffffff; padding: 10px 20px; color: #000000; font-family: 'Georgia', serif; font-size: 18px;">
              Centro Académico<br>de Alajuela
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">Solicitud de verificación de rol para Profesor</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 10px 0;">
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Estimado/a ${adminName},
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          La persona con los siguientes detalles ha solicitado acceso a las funciones de profesor:
        </p>
        <ul style="text-align: left; color: #555; line-height: 1.5;">
          <li><strong>Cédula/Carnet:</strong> ${cedulaCarnet}</li>
          <li><strong>Nombre:</strong> ${nombre}</li>
          <li><strong>Correo:</strong> ${correoEmail}</li>
        </ul>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Por favor, verifique que la información del usuario corresponde a un profesor y, si es correcto, diríjase a la administración de usuarios para cambiar su rol a 'Profesor'.
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Atentamente,<br>
          El sistema de administración
        </p>
      </td>
    </tr>
  </table>
</div>
                `;

                // Enviar el correo electrónico
                await sendEmail(
                    CorreoEmail,  // Correo del administrador actual en la iteración
                    emailSubject,  // Asunto del correo
                    emailText,     // Texto plano del correo
                    emailHtml      // HTML del correo
                );
            }

            // Responder con éxito
            res.json({ message: 'Correos enviados correctamente a los administradores' });

        } catch (error) {
            // Manejo de errores
            console.error(error);
            res.status(500).json({ message: 'Error al enviar los correos' });
        }
    }




}
