import "dotenv/config";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.ETHEREAL_HOST || "smtp.ethereal.email",
    port: Number(process.env.ETHEREAL_PORT || 587),
    secure: Number(process.env.ETHEREAL_PORT || 587) === 465,
    auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
    },
});