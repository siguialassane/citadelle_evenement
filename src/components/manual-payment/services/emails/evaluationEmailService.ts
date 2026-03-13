import emailjs from '@emailjs/browser';
import { supabase } from "@/integrations/supabase/client";
import { EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, PARTICIPANT_TEMPLATE_ID } from "../../config";
import { EVALUATION_INVITATION_TEMPLATE } from "../../EmailTemplates";

/**
 * Envoie un email d'invitation à l'évaluation à un participant
 * et met à jour evaluation_email_sent_at dans la BD
 */
export const sendEvaluationEmail = async (participant: any): Promise<{ ok: boolean; error?: string }> => {
  try {
    if (!participant?.email?.trim()) return { ok: false, error: "Email vide" };

    const evaluationUrl = `${window.location.origin}/suivi-soiree/${participant.id}`;
    const emailHtml = EVALUATION_INVITATION_TEMPLATE(
      participant.first_name,
      participant.last_name,
      evaluationUrl
    );

    const isResend = !!participant.evaluation_email_sent_at;
    const templateParams = {
      to_email: participant.email.trim(),
      subject: isResend
        ? `Merci encore pour votre présence à l'IFTAR 2026`
        : `Merci pour votre présence à l'IFTAR 2026`,
      email_participant: emailHtml,
      prenom: participant.first_name,
      nom: participant.last_name,
      participant_name: `${participant.first_name} ${participant.last_name}`,
      participant_email: participant.email,
      reply_to: "club.lacitadelle@gmail.com",
    };

    const response = await emailjs.send(EMAILJS_SERVICE_ID, PARTICIPANT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log(`[EvaluationEmail] Envoyé à ${participant.email} — status: ${response.status}, text: ${response.text}`);

    // Marquer comme envoyé en BD
    await (supabase.from as any)('participants')
      .update({ evaluation_email_sent_at: new Date().toISOString() })
      .eq('id', participant.id);

    return { ok: true };
  } catch (error: any) {
    const errMsg = error?.text || error?.message || String(error);
    console.error(`[EvaluationEmail] ERREUR pour ${participant?.email}:`, errMsg, error);
    return { ok: false, error: errMsg };
  }
};

/**
 * Envoie par lots de 5 avec délai entre chaque lot
 */
export const sendEvaluationEmailBatch = async (
  participants: any[],
  onProgress: (sent: number, failed: number, current: number, lastError?: string) => void
): Promise<{ sent: number; failed: number; lastError?: string }> => {
  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;
  const BATCH_SIZE = 5;
  const DELAY_MS = 1200;

  for (let i = 0; i < participants.length; i++) {
    const result = await sendEvaluationEmail(participants[i]);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      lastError = result.error;
    }
    onProgress(sent, failed, i + 1, lastError);

    // Pause entre chaque lot de 5
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < participants.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  return { sent, failed, lastError };
};
