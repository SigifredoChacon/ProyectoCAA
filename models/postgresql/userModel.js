import mysql from 'mysql2/promise'
import {DBConfig} from '../../DBConfig.js'
import bcrypt from 'bcrypt'
import {sendEmail} from "../../services/emailService.js";

const connection = await mysql.createConnection(DBConfig)

export class userModel {

    static async getAll () {
        const [users] = await connection.query(
            `SELECT 
        u.CedulaCarnet,
        u.Nombre,
        u.CorreoEmail,
        u.Contrasena,
        u.Telefono,
        u.Telefono2,
        u.Direccion,
        u.Estado,
        u.CorreoInstitucional,
        r.nombre AS NombreRol,
        r.idRol AS idRol
        FROM 
            usuario u
        JOIN 
            rol r ON u.idRol = r.idRol;`,
        )
        return users
    }

    static async getAllEmails() {
        const [emails] = await connection.query(
            `SELECT CorreoEmail FROM usuario`
        );
        return emails;
    }

    static async login ({ input }) {
        const { email, password} = input
        const [user] = await connection.query(
            `SELECT u.Contrasena, u.CedulaCarnet, u.Estado, r.nombre AS RolNombre
     FROM usuario u
     JOIN rol r ON u.idRol = r.idRol
     WHERE u.CorreoEmail = ? OR u.CorreoInstitucional = ?`,
            [email, email]
        )


        if(user.length === 0) {
            return null
        }
        const isValid = await bcrypt.compare(password, user[0].Contrasena)
        if (!isValid) {
            return null
        }
        return user[0]
    }

    static async getById ({ id }) {
        const [user] = await connection.query(
            'SELECT * FROM Usuario WHERE CedulaCarnet = ?',
            [id]
        )
        if(user.length === 0) {
            return null
        }
        return user[0]
    }


    // En el modelo userModel.js
    static async create({ input }) {
        const {
            cedulaCarnet,
            nombre,
            correoEmail,
            correoInstitucional,
            contrasena,
            telefono,
            telefono2,
            direccion,
            idRol
        } = input;

        try {
            const [resultCedula] = await connection.query(
              'SELECT cedulaCarnet FROM usuario WHERE cedulaCarnet = ?',
              [cedulaCarnet]
            );

            if (resultCedula.length > 0) {
                throw new Error('Usuario existente con esa cédula');
            }

            const [resultEmail] = await connection.query(
              'SELECT correoEmail FROM usuario WHERE correoEmail = ?',
              [correoEmail]
            );

            if (resultEmail.length > 0) {
                throw new Error('Usuario existente con ese correo');
            }

            const [resultTelefono] = await connection.query(
              'SELECT telefono FROM usuario WHERE telefono = ?',
              [telefono]
            );

            if (resultTelefono.length > 0) {
                throw new Error('Usuario existente con ese teléfono');
            }

            const [resultRole] = await connection.query(
              'SELECT idRol FROM rol WHERE idRol = ?',
              [idRol]
            );

            if (resultRole.length <= 0) {
                throw new Error('Rol no válido');
            }

            const hashedPassword = await bcrypt.hash(contrasena, 10);

            await connection.query(
              'INSERT INTO usuario (CedulaCarnet, Nombre, CorreoEmail, CorreoInstitucional, Contrasena, Telefono, Telefono2, Direccion, Estado, idRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [cedulaCarnet, nombre, correoEmail, correoInstitucional, hashedPassword, telefono, telefono2, direccion, false, idRol]
            );

            const [user] = await connection.query(
              `SELECT * FROM usuario WHERE CedulaCarnet = ?;`,
              [cedulaCarnet]
            );

            return user[0];
        } catch (error) {
            return error.message; // Retorna el mensaje de error
        }
    }


    static async delete ({ id }) {
        try {
            await connection.query(
                'DELETE FROM usuario WHERE CedulaCarnet = ?',
                [id]
            )
        }
        catch (error) {
            throw new Error(error)
        }
        return true
    }

    static async update({ id, input }) {
        const {
            nombre,
            correoEmail,
            correoInstitucional,
            contrasena,
            telefono,
            telefono2,
            direccion,
            estado,
            idRol
        } = input
        try {


            const [resultEmail] = await connection.query(
                'SELECT correoEmail FROM usuario WHERE CorreoEmail = ?',
                [correoEmail]
            )
            if (resultEmail.length > 0) {
                throw new Error('Usuario existente con ese correo');
            }

            const [resultTelefono] = await connection.query(
                'SELECT telefono FROM usuario WHERE Telefono = ?',
                [telefono]
            )
            if (resultTelefono.length > 0) {
                throw new Error('Usuario existente con ese teléfono');
            }
            let hashedPassword = contrasena
            if(contrasena){
                 hashedPassword = await bcrypt.hash(contrasena, 10)
            }


            const [result] = await connection.query(
                `UPDATE usuario
       SET Nombre = COALESCE(?, Nombre),
           CorreoEmail = COALESCE(?, CorreoEmail),
           CorreoInstitucional = COALESCE(?, CorreoInstitucional),
           Contrasena = COALESCE(?, Contrasena),
           Telefono = COALESCE(?, Telefono),
           Telefono2 = COALESCE(?, Telefono2),
           Direccion = COALESCE(?, Direccion),
           Estado = COALESCE(?, Estado),
           idRol = COALESCE(?, idRol)
           
       WHERE CedulaCarnet = ?;`,
                [nombre, correoEmail, correoInstitucional, hashedPassword, telefono, telefono2, direccion, estado, idRol, id]
            );
            if (result.affectedRows === 0) {
                throw new Error('No se encontro el usuario con ese id');
            }

            const [updatedUser] = await connection.query(
                `SELECT *
                    FROM usuario WHERE CedulaCarnet = ?;`,
                [id]
            );

            return updatedUser[0];
        } catch (error) {
            return error.message;
        }
    }
    static async updatePassword({ id }) {
        try {

            const [userDetails] = await connection.query(
                `SELECT Usuario.Nombre, Usuario.CorreoEmail
             FROM Usuario
             INNER JOIN Rol ON Usuario.idRol = Rol.idRol
             WHERE CedulaCarnet = ?;`,
                [id]
            );

            if (userDetails.length === 0) {
                throw new Error('No se encontró el usuario con ese id');
            }

            const emailSubject = 'Recuperación de contraseña';

            // Función para generar una contraseña aleatoria
            const generateRandomPassword = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 10; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return password;
            };

            // Generar la nueva contraseña
            const newPassword = generateRandomPassword();

            // Hashear la nueva contraseña
            let hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar la contraseña en la base de datos
            const [result] = await connection.query(
                `UPDATE Usuario
             SET Contrasena = ?
             WHERE CedulaCarnet = ?;`,
                [hashedPassword, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('No se encontró el usuario con ese id');
            }

            // Enviar el correo con la nueva contraseña
            userDetails.forEach(({ Nombre, CorreoEmail }) => {
                const emailText = `
                Hola ${Nombre},

                Hemos recibido una solicitud de recuperación de contraseña. 
                Tu nueva contraseña temporal es: ${newPassword}
                
                Por favor, cambia tu contraseña después de iniciar sesión.
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
        <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${emailSubject}</h1>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 10px 0;">
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Hola ${Nombre}, hemos recibido una solicitud de recuperación de contraseña. Tu nueva contraseña temporal es: <strong>${newPassword}</strong>
        </p>
        <p style="font-size: 16px; color: #555; line-height: 1.5; margin: 0; text-align: justify;">
          Por favor, cambia tu contraseña después de iniciar sesión.
        </p>
      </td>
    </tr>
  </table>
</div>
`;

                // Enviar el correo
                sendEmail(
                    CorreoEmail,
                    emailSubject,
                    emailText,
                    emailHtml
                );
            });

            // Retornar el resultado del usuario actualizado
            const [updatedUser] = await connection.query(
                `SELECT *
             FROM Usuario WHERE CedulaCarnet = ?;`,
                [id]
            );

            return updatedUser[0];
        } catch (error) {
            return error.message;
        }
    }


}