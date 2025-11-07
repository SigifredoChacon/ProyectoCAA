import pkg from 'pg';
const { Pool } = pkg;
import {DBConfig} from '../../DBConfig.js'
import bcrypt from 'bcrypt'
import {sendEmail} from "../../services/emailService.js";
import {validatePassword} from "../../services/validatePasswordService.js";

const pool = new Pool(DBConfig);

export class userModel {

    static async getAll() {
        const { rows: users } = await pool.query(
            `SELECT
                u."CedulaCarnet",
                u."Nombre",
                u."CorreoEmail",
                u."Telefono",
                u."Telefono2",
                u."Direccion",
                u."Estado",
                u."CorreoInstitucional",
                r."nombre" AS "NombreRol",
                r."idRol" AS "idRol"
            FROM
                "usuario" u
            JOIN
                "rol" r ON u."idRol" = r."idRol";`
        );

        return users;
    }


    static async getAllEmails() {
        const { rows: emails } = await pool.query(
            `SELECT "CorreoEmail" FROM "usuario";`
        );
        return emails;
    }


    static async login({ input }) {
        const { email, password } = input;
        const { rows: users } = await pool.query(
            `SELECT
                u."Contrasena",
                u."CedulaCarnet",
                u."Estado",
                r."nombre" AS "RolNombre"
             FROM "usuario" u
             JOIN "rol" r ON u."idRol" = r."idRol"
             WHERE u."CorreoEmail" = $1 OR u."CorreoInstitucional" = $2;`,
            [email, email]
        );

        if (users.length === 0) {
            return null;
        }

        const isValid = await bcrypt.compare(password, users[0].Contrasena);
        if (!isValid) {
            return null;
        }

        return users[0];
    }


    static async getById({ id }) {
        const { rows: users } = await pool.query(
            `SELECT *
             FROM "usuario"
             WHERE "CedulaCarnet" = $1;`,
            [id]
        );

        if (users.length === 0) {
            return null;
        }

        return users[0];
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

            //Validar contraseña
            const { ok, errores } = validatePassword(contrasena);
            if (!ok) {
                throw new Error('Contraseña no válida: ' + errores.join(' '));
            }
            // Validar cédula
            const { rows: resultCedula } = await pool.query(
                `SELECT "CedulaCarnet" FROM "usuario" WHERE "CedulaCarnet" = $1;`,
                [cedulaCarnet]
            );
            if (resultCedula.length > 0) throw new Error('Usuario existente con esa cédula');

            // Validar correo
            const { rows: resultEmail } = await pool.query(
                `SELECT "CorreoEmail" FROM "usuario" WHERE "CorreoEmail" = $1;`,
                [correoEmail]
            );
            if (resultEmail.length > 0) throw new Error('Usuario existente con ese correo');

            // Validar teléfono
            const { rows: resultTelefono } = await pool.query(
                `SELECT "Telefono" FROM "usuario" WHERE "Telefono" = $1;`,
                [telefono]
            );
            if (resultTelefono.length > 0) throw new Error('Usuario existente con ese teléfono');

            // Validar rol
            const { rows: resultRole } = await pool.query(
                `SELECT "idRol" FROM "rol" WHERE "idRol" = $1;`,
                [idRol]
            );
            if (resultRole.length === 0) throw new Error('Rol no válido');

            // Hashear contraseña
            const hashedPassword = await bcrypt.hash(contrasena, 10);

            // Insertar usuario
            await pool.query(
                `INSERT INTO "usuario"
                ("CedulaCarnet", "Nombre", "CorreoEmail", "CorreoInstitucional", "Contrasena", "Telefono", "Telefono2", "Direccion", "Estado", "idRol")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
                [cedulaCarnet, nombre, correoEmail, correoInstitucional, hashedPassword, telefono, telefono2, direccion, false, idRol]
            );

            // Obtener el usuario creado
            const { rows: user } = await pool.query(
                `SELECT * FROM "usuario" WHERE "CedulaCarnet" = $1;`,
                [cedulaCarnet]
            );

            return user[0];
        } catch (error) {
            return error.message;
        }
    }



    static async delete({ id }) {
        try {
            await pool.query(
                `DELETE FROM "usuario" WHERE "CedulaCarnet" = $1;`,
                [id]
            );
        } catch (error) {
            throw new Error(error.message);
        }
        return true;
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
        } = input;

        try {
            const { rows:resultEmail } = await pool.query(
                `SELECT "CorreoEmail" FROM "usuario" WHERE "CorreoEmail" = $1`,
                [correoEmail]
            );
            if (resultEmail.length > 0) {
                throw new Error('Usuario existente con ese correo');
            }

            const {rows:resultTelefono} = await pool.query(
                `SELECT "Telefono" FROM "usuario" WHERE "Telefono" = $1`,
                [telefono]
            );
            if (resultTelefono.length > 0) {
                throw new Error('Usuario existente con ese teléfono');
            }

            let hashedPassword = contrasena;
            if (contrasena) {
                hashedPassword = await bcrypt.hash(contrasena, 10);
            }

            const { rowCount} = await pool.query(
                `UPDATE "usuario"
                 SET "Nombre" = COALESCE($1, "Nombre"),
                     "CorreoEmail" = COALESCE($2, "CorreoEmail"),
                     "CorreoInstitucional" = COALESCE($3, "CorreoInstitucional"),
                     "Contrasena" = COALESCE($4, "Contrasena"),
                     "Telefono" = COALESCE($5, "Telefono"),
                     "Telefono2" = COALESCE($6, "Telefono2"),
                     "Direccion" = COALESCE($7, "Direccion"),
                     "Estado" = COALESCE($8, "Estado"),
                     "idRol" = COALESCE($9, "idRol")
                 WHERE "CedulaCarnet" = $10;`,
                [nombre, correoEmail, correoInstitucional, hashedPassword, telefono, telefono2, direccion, estado, idRol, id]
            );


            if (rowCount === 0) {
                throw new Error('No se encontró el usuario con ese id');
            }

            const {rows:updatedUser} = await pool.query(
                `SELECT * FROM "usuario" WHERE "CedulaCarnet" = $1;`,
                [id]
            );

            return updatedUser[0];
        } catch (error) {
            return error.message;
        }
    }


    static async updatePassword({ id }) {
        try {

            const {rows: userResult} = await pool.query(
                        `SELECT "usuario"."Nombre", "usuario"."CorreoEmail"
                         FROM "usuario"
                         INNER JOIN "rol" ON "usuario"."idRol" = "rol"."idRol"
                         WHERE "CedulaCarnet" = $1;`,
                        [id]
                    );

            const userDetails = userResult;

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
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar la contraseña en la base de datos
            const {rowCount} = await pool.query(
                 `UPDATE "usuario"
                 SET "Contrasena" = $1
                 WHERE "CedulaCarnet" = $2;`,
                 [hashedPassword, id]
            );

            if (rowCount === 0) {
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
            const {rows: updatedUser } = await pool.query(
                `SELECT *
             FROM "usuario" WHERE "CedulaCarnet" = $1;`,
                [id]
            );


            return updatedUser[0];
        } catch (error) {
            return error.message;
        }
    }


}