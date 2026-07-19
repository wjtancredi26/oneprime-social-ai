import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  console.log(
    "RESEND_API_KEY:",
    apiKey ? "CONFIGURADA" : "NÃO ENCONTRADA"
  );

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada no servidor."
    );
  }

  return new Resend(apiKey);
}

function getEmailFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "OnePrime Social AI <onboarding@resend.dev>"
  );
}

export async function verifyEmailConnection() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada no servidor."
    );
  }

  return true;
}

export async function sendPasswordResetEmail({
  recipient,
  userName,
  resetUrl,
}) {
  if (!recipient) {
    throw new Error(
      "Destinatário do e-mail não informado."
    );
  }

  if (!resetUrl) {
    throw new Error(
      "Link de redefinição de senha não informado."
    );
  }

  const resend = getResendClient();
  const from = getEmailFrom();

  console.log("ENVIANDO E-MAIL DE RECUPERAÇÃO:", {
    recipient,
    from,
  });

  const { data, error } = await resend.emails.send({
    from,
    to: [recipient],
    subject:
      "Redefinição de senha — OnePrime Social AI",

    text: `
Olá, ${userName || "usuário"}.

Recebemos uma solicitação para redefinir sua senha do OnePrime Social AI.

Abra o endereço abaixo para cadastrar uma nova senha:

${resetUrl}

O link ficará disponível por 30 minutos e poderá ser usado somente uma vez.

Caso você não tenha solicitado essa alteração, ignore esta mensagem.
`.trim(),

    html: `
      <div style="margin:0;padding:32px;background:#071020;font-family:Arial,sans-serif;color:#ffffff">
        <div style="max-width:580px;margin:auto;padding:32px;background:#111c32;border:1px solid #263654;border-radius:18px">

          <h1 style="margin:0 0 8px;font-size:25px">
            OnePrime
            <span style="color:#38bdf8">
              Social AI
            </span>
          </h1>

          <h2 style="margin-top:28px">
            Redefinição de senha
          </h2>

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
            Este link ficará disponível por 30 minutos e poderá ser
            utilizado somente uma vez.
          </p>

          <p style="line-height:1.6;color:#94a3b8;font-size:14px">
            Caso você não tenha solicitado esta alteração, ignore
            esta mensagem.
          </p>

        </div>
      </div>
    `,
  });

  if (error) {
    console.error("ERRO RESEND:", error);

    throw new Error(
      error.message ||
        "Erro ao enviar e-mail pelo Resend."
    );
  }

  if (!data?.id) {
    throw new Error(
      "O Resend não retornou a confirmação do envio."
    );
  }

  console.log(
    "E-MAIL DE RECUPERAÇÃO ENVIADO:",
    data.id
  );

  return data;
}