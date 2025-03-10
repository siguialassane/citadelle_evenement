
// Service d'envoi d'emails pour la validation des paiements
// Mise à jour: Séparation complète des services d'envoi
// Mise à jour: Un seul type d'email par action

import emailjs from '@emailjs/browser';
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID,
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  EVENT_LOCATION
} from "@/components/manual-payment/config";

export const sendConfirmationEmail = async (participantData: any, qrCodeId: string): Promise<boolean> => {
  try {
    console.log("==== ENVOI EMAIL DE CONFIRMATION UNIQUEMENT ====");
    console.log("Service de confirmation exclusif:", CONFIRMATION_EMAILJS_SERVICE_ID);
    
    const appUrl = window.location.origin;
    const confirmationPageUrl = `${appUrl}/confirmation/${qrCodeId}?type=qr&pid=${participantData.id}`;
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    const receiptUrl = `${appUrl}/receipt/${participantData.id}`;
    
    const templateParams = {
      to_email: participantData.email.trim(),
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      qr_code_url: qrCodeImageUrl,
      confirmation_url: confirmationPageUrl,
      receipt_url: receiptUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      confirmation_date: new Date().toLocaleDateString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    const response = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID,
      templateParams,
      CONFIRMATION_EMAILJS_PUBLIC_KEY
    );

    console.log("Email de confirmation envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    return false;
  }
};
