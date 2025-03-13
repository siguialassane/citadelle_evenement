
import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { 
  REJECTION_EMAILJS_SERVICE_ID, 
  REJECTION_EMAILJS_PUBLIC_KEY,
  REJECTION_TEMPLATE_ID
} from "../../config";

/**
 * Envoie un email de rejet au participant dont le paiement a été refusé
 */
export const sendPaymentRejectionEmail = async (
  participantData: any,
  rejectionReason: string
): Promise<boolean> => {
  try {
    console.log("===== ENVOI EMAIL DE REJET =====");
    console.log("Service dédié UNIQUEMENT pour email de rejet:", REJECTION_EMAILJS_SERVICE_ID);
    
    // Validation des données du participant
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error("Validation d'email échouée:", validation.error);
      return false;
    }
    
    // Préparation de l'email
    const email = prepareEmailData(participantData.email);
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    const appUrl = window.location.origin;
    
    // Vérification de l'URL de l'application
    console.log("URL de l'application (app_url):", appUrl);
    
    // Préparation des paramètres du template
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2025",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_phone: participantData.contact_number || "Non disponible",
      status: memberStatus,
      rejection_reason: rejectionReason || "Raison non spécifiée",
      app_url: appUrl,
      current_date: new Date().toLocaleString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    // Log de la configuration EmailJS
    console.log("EmailJS configuration pour email de rejet:", {
      service_id: REJECTION_EMAILJS_SERVICE_ID,
      template_id: REJECTION_TEMPLATE_ID,
      params_count: Object.keys(templateParams).length
    });

    // Initialisation explicite pour éviter les problèmes d'authentification
    emailjs.init(REJECTION_EMAILJS_PUBLIC_KEY);
    
    // Envoi de l'email via EmailJS
    const response = await emailjs.send(
      REJECTION_EMAILJS_SERVICE_ID,
      REJECTION_TEMPLATE_ID,
      templateParams
    );
    
    console.log("Email de rejet envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet:", error);
    return false;
  }
};
