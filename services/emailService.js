import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'centroacademicoalajuela@gmail.com',
        pass: 'vgua crep ugru ovus'
    }
});

export const sendEmail = (to, subject, text, html) => {
    const mailOptions = {
        from: 'centroacademicoalajuela@gmail.com',
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error al enviar correo: ', error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });
};
