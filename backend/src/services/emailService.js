import nodemailer from "nodemailer";

function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from =
    process.env.SMTP_FROM ||
    `OnePrime Social AI <${user || "no-reply@oneprime.local"}>`;

  if (!host || !user || !password) {
    throw new Error(
      "Configuração de e-mail incompleta. Verifique SMTP_HOST, SMTP_USER e SMTP_PASSWORD."
    );
  }

  return {
    host,
    port,
    user,
    password,
    from,
  };
}

function createTransporter() {
  const config = getEmailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,

    // Porta 465 usa TLS desde o início.
    secure: config.port === 465,

    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

export async function verifyEmailConnection() {
  const transporter = createTransporter();
  await transporter.verify();

  return true;
}

export async function sendPasswordResetEmail({
  recipient,
  userName,
  resetUrl,
}) {
  const config = getEmailConfig();
  const transporter = createTransporter();

  await transporter.sendMail({
    from: config.from,
    to: recipient,
    subject: "Redefinição de senha — OnePrime Social AI",

    text: `
Olá, ${userName || "usuário"}.

Recebemos uma solicitação para redefinir sua senha do OnePrime Social AI.

Abra este endereço para cadastrar uma nova senha:

${resetUrl}

O link ficará disponível por 30 minutos.

Caso você não tenha solicitado a redefinição, ignore esta mensagem.
`.trim(),

    html: `
      <div style="margin:0;padding:32px;background:#071020;font-family:Arial,sans-serif;color:#ffffff">
        <div style="max-width:580px;margin:auto;padding:32px;background:#111c32;border:1px solid #263654;border-radius:18px">
          <h1 style="margin:0 0 8px;font-size:25px">
            OnePrime <span style="color:#38bdf8">Social AI</span>
          </h1>

          <h2 style="margin-top:28px">Redefinição de senha</h2>

          <p style="line-height:1.6;color:#cbd5e1">
            Olá, ${userName || "usuário"}.
          </p>

          <p style="line-height:1.6;color:#cbd5e1">
            Recebemos uma solicitação para redefinir sua senha.
            Clique no botão abaixo para cadastrar uma nova senha.
          </p>

          <p style="margin:28px 0">
            <a
              href="${resetUrl}"
              style="display:inline-block;padding:14px 22px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold"
            >
              Cadastrar nova senha
            </a>
          </p>

          <p style="line-height:1.6;color:#94a3b8;font-size:14px">
            Este link ficará disponível por 30 minutos e poderá ser usado uma única vez.
          </p>

          <p style="line-height:1.6;color:#94a3b8;font-size:14px">
            Caso você não tenha solicitado esta alteração, ignore esta mensagem.
          </p>
        </div>
      </div>
    `,
  });
}