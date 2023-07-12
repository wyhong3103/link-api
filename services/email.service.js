const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport(
    {
        service : 'gmail',
        auth : {
            user : process.env.SERVICE_EMAIL,
            pass : process.env.SERVICE_EMAIL_PW,
        }
    }
)

const sendVerificationEmail = async (to, token) => {
    try{
        const mailOptions = {
            from: process.env.SERVICE_EMAIL,
            to: to,
            subject: 'Verify Your Email On Link',
            text: `Click the link below to verify your email.\n ${process.env.CLIENT_URL}'/verify-email?token=${token}`
        };

        await transporter.sendMail(mailOptions);
        return true
    }catch (err) {
        console.log(err);
        return false
    }
}

const sendPasswordResetEmail = async (to, token) => {
    try{
        const mailOptions = {
            from: process.env.SERVICE_EMAIL,
            to: to,
            subject: 'Password Reset On Link',
            text: `Click the link below to reset your password.\n ${process.env.CLIENT_URL}'/verify-reset-password?token=${token}`
        };

        await transporter.sendMail(mailOptions);
        return true
    }catch (err) {
        console.log(err);
        return false
    }
}


module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
}
