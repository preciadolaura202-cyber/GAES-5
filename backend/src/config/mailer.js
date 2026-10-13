const nodemailer = require("nodemailer");
require("dotenv").config();

// Cuenta emisora (Gmail + App Password de Google)
const MAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER;
const MAIL_PASS = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || (MAIL_USER ? `SegurIA <${MAIL_USER}>` : "");

let transporter = null;
if (MAIL_USER && MAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });
}

function isMailerConfigured() {
  return Boolean(transporter);
}

/**
 * Envía el código de recuperación al correo del usuario.
 * @param {string} to Correo destino
 * @param {string} code Código de 6 dígitos
 */
async function sendRecoveryCode(to, code) {
  if (!transporter) {
    throw new Error(
      "El servicio de correo no está configurado. Define GMAIL_USER y GMAIL_APP_PASSWORD en el archivo .env"
    );
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#070A11; padding:32px;">
      <div style="max-width:480px; margin:0 auto; background:#0E1422; border:1px solid #1E293B; border-radius:12px; overflow:hidden;">
        <div style="padding:20px 24px; border-bottom:1px solid #1E293B;">
          <span style="color:#00E5FF; font-size:20px; font-weight:800; letter-spacing:1px;">Segur<span style="color:#FFE500;">IA</span></span>
        </div>
        <div style="padding:28px 24px; color:#E2E8F0;">
          <h2 style="margin:0 0 12px; font-size:18px; color:#FFFFFF;">Recuperación de clave de acceso</h2>
          <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#A0ABBA;">
            Usa este código de verificación para restablecer tu clave. Es válido durante 10 minutos.
          </p>
          <div style="background:#111827; border:1px solid #334155; border-radius:10px; padding:18px; text-align:center;">
            <span style="font-family:'Courier New', monospace; font-size:34px; letter-spacing:12px; color:#FFE500; font-weight:700;">${code}</span>
          </div>
          <p style="margin:20px 0 0; font-size:12px; color:#64748B;">
            Si no solicitaste este código, ignora este mensaje. Nunca compartas tu código con nadie.
          </p>
        </div>
        <div style="padding:16px 24px; border-top:1px solid #1E293B; color:#64748B; font-size:11px;">
          SegurIA · Prevención Urbana y Alertas en Tiempo Real
        </div>
      </div>
    </div>
  `;

  const text = `SegurIA - Recuperación de clave\n\nTu código de verificación es: ${code}\nVálido durante 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: "SegurIA · Código de recuperación de clave",
    text,
    html,
  });
}

module.exports = {
  sendRecoveryCode,
  isMailerConfigured,
};
