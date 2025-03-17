
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
 */
export const sendPaymentRejectionEmail = async (participantData: any, rejectionReason: string = '') => {
  try {
    console.log("===== PRÉPARATION EMAIL DE REJET =====");
    console.log("Utilisation du service REJET UNIQUEMENT:", REJECTION_EMAILJS_SERVICE_ID);
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = prepareEmailData(participantData.email);
    
    // Construction explicite de l'URL complète
    const appUrl = window.location.origin;
    const tryAgainUrl = `${appUrl}/payment/${participantData.id}`;
    
    console.log("URL de nouvel essai construite:", tryAgainUrl);
    console.log("ID du participant:", participantData.id);
    console.log("Origine de l'application:", appUrl);
    
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2025",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_id: participantData.id, // Ajout explicite de l'ID
      rejection_reason: rejectionReason || "Le paiement n'a pas pu être vérifié ou confirmé",
      app_url: appUrl, // URL de base complète
      try_again_url: tryAgainUrl, // URL complète construite
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    // Logs supplémentaires pour le débogage
    console.log("Paramètres EmailJS pour email de rejet:", {
      to_email: templateParams.to_email,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_id: templateParams.participant_id,
      try_again_url: templateParams.try_again_url,
      app_url: templateParams.app_url
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
