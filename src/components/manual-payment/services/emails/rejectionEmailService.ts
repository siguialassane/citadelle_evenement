
import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { 
  REJECTION_EMAILJS_SERVICE_ID,
  REJECTION_EMAILJS_PUBLIC_KEY,
  REJECTION_TEMPLATE_ID,
} from "../../config";

/**
 * Envoie un email de rejet au participant
 * Utilise le template participant unique (template_3e5dq5i) avec contenu dynamique
 */
export const sendPaymentRejectionEmail = async (participantData: any, rejectionReason: string = '') => {
  try {
    console.log("===== PRÉPARATION EMAIL DE REJET =====");
    console.log("Service:", REJECTION_EMAILJS_SERVICE_ID);
    console.log("Template:", REJECTION_TEMPLATE_ID);
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = prepareEmailData(participantData.email);
    
    const appUrl = window.location.origin;
    const tryAgainUrl = `${appUrl}/payment/${participantData.id}`;
    const reason = rejectionReason || "Le paiement n'a pas pu être vérifié ou confirmé";

    // Génération du contenu HTML dynamique pour le rejet
    const emailParticipantHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f9f4f4;">
        <div style="background-color:white;border-radius:10px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.08);border-top:5px solid #c0392b;">
          <div style="text-align:center;color:#07553B;font-size:1.2em;margin-bottom:15px;font-style:italic;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div style="text-align:center;padding-bottom:15px;border-bottom:1px solid #fde8e8;margin-bottom:20px;">
            <p style="font-size:2em;margin:0;">🌙</p>
            <h1 style="color:#c0392b;font-size:1.4em;margin:5px 0;">Inscription non validée</h1>
            <span style="display:inline-block;background-color:#e74c3c;color:white;padding:6px 16px;border-radius:20px;font-size:0.9em;">IFTAR 2026 — 15e Édition</span>
          </div>
          <p>Assalamou Aleykoum wa rahmatullahi wa barakatuh, cher(e) <strong>${participantData.first_name} ${participantData.last_name}</strong>,</p>
          <p>Nous sommes au regret de vous informer que votre inscription à l'<strong>IFTAR 2026</strong> n'a pas pu être validée. Qu'Allah vous facilite la situation.</p>
          <div style="background-color:#fdf2f2;padding:15px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #e74c3c;">
            <h3 style="margin-top:0;color:#c0392b;">⚠️ Motif du rejet :</h3>
            <p style="margin:0;">${reason}</p>
          </div>
          <div style="background-color:#f0f9f4;border-left:4px solid #07553B;padding:12px 16px;margin:20px 0;font-style:italic;color:#555;border-radius:4px;">
            « Certes, avec la difficulté vient la facilité. »<br>
            <em>(Coran 94:6)</em>
          </div>
          <p>Si vous pensez qu'il s'agit d'une erreur ou souhaitez soumettre une nouvelle demande, vous pouvez réessayer :</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${tryAgainUrl}" style="display:inline-block;padding:12px 24px;background-color:#07553B;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">🔄 Réessayer le paiement</a>
          </div>
          <p style="font-size:0.9em;color:#666;">Pour toute question, contactez-nous à : <a href="mailto:club.lacitadelle@gmail.com" style="color:#07553B;">club.lacitadelle@gmail.com</a></p>
          <div style="text-align:center;margin-top:25px;font-size:0.85em;color:#888;border-top:1px solid #fde8e8;padding-top:15px;">
            <p>Qu'Allah vous facilite et vous bénisse.</p>
            <p>Association LA CITADELLE — IFTAR 2026 © Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `;

    // Template: template_3e5dq5i - Params: {{{email_participant}}}, {{to_email}}, {{subject}}
    const templateParams: EmailTemplateParams = {
      to_email: email,
      subject: `Inscription non validée - ${participantData.first_name} ${participantData.last_name}`,
      email_participant: emailParticipantHtml,
      // Params supplémentaires pour compatibilité
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "La Citadelle",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_id: participantData.id,
      rejection_reason: reason,
      app_url: appUrl,
      try_again_url: tryAgainUrl,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Paramètres EmailJS pour email de rejet:", {
      to_email: templateParams.to_email,
      subject: templateParams.subject,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_id: templateParams.participant_id,
    });

    const response = await emailjs.send(
      REJECTION_EMAILJS_SERVICE_ID,
      REJECTION_TEMPLATE_ID,
      templateParams,
      REJECTION_EMAILJS_PUBLIC_KEY
    );

    console.log("Email de rejet envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet:", error);
    return false;
  }
};

// Réexportation explicite pour la compatibilité
export { sendPaymentRejectionEmail as sendRejectionEmail };
