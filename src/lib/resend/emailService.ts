/**
 * Serviço de envio de emails com Resend
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RHaaS <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Envia convite de entrevista para o candidato
 */
export async function sendInterviewInvitation(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  accessToken: string;
  interviewId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { candidateName, candidateEmail, jobTitle, accessToken } = params;

  const interviewLink = `${APP_URL}/interview?token=${accessToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [candidateEmail],
      subject: `🎉 Você foi aprovado! Entrevista para ${jobTitle}`,
      html: getInterviewInvitationHTML({
        candidateName,
        jobTitle,
        interviewLink,
      }),
    });

    if (error) {
      console.error("❌ Erro ao enviar email:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`✅ Email enviado para ${candidateEmail} - ID: ${data?.id}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Template HTML do convite de entrevista
 */
function getInterviewInvitationHTML(params: {
  candidateName: string;
  jobTitle: string;
  interviewLink: string;
}): string {
  const { candidateName, jobTitle, interviewLink } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para Entrevista</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Parabéns!
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Você foi aprovado para a próxima etapa
              </p>
            </td>
          </tr>
          
          <!-- Corpo -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Olá <strong>${candidateName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Ficamos muito felizes em informar que você foi aprovado na análise de currículo para a vaga de <strong>${jobTitle}</strong>!
              </p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                A próxima etapa é uma <strong>entrevista comportamental</strong> que será conduzida por nossa IA especializada em recrutamento. A entrevista dura aproximadamente <strong>15 minutos</strong> e você pode fazê-la no horário que preferir.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${interviewLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Iniciar Entrevista
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Instruções -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                  📋 Instruções:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                  <li>Certifique-se de que seu microfone está funcionando</li>
                  <li>Escolha um ambiente tranquilo e sem ruídos</li>
                  <li>A entrevista durará aproximadamente 15 minutos</li>
                  <li>Fale naturalmente, como se estivesse conversando com um recrutador</li>
                  <li>Cite exemplos concretos e situações reais que você viveu</li>
                  <li>Seja honesto e autêntico em suas respostas</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Se tiver alguma dúvida, entre em contato conosco.
              </p>
              
              <p style="margin: 10px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Boa sorte! 🚀
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                Este link é pessoal e intransferível. Não compartilhe com terceiros.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} RHaaS - Recrutamento Inteligente
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Valida se o Resend está configurado
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

