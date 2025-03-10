
import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_INITIAL_TEMPLATE_ID,
  ADMIN_NOTIFICATION_TEMPLATE_ID,
  PAYMENT_AMOUNT,
  EVENT_LOCATION,
  ADMIN_EMAIL
} from "../../config";

/**
 * Envoie un email à l'administrateur pour notifier d'un nouveau paiement
 */
export const sendAdminNotification = async (
  adminEmail: string,
  manualPaymentId: string,
  participantData: any,
  paymentMethod: string,
  phoneNumber: string,
  comments: string,
  transactionReference: string
) => {
  try {
    console.log("Envoi de notification à l'administrateur pour nouveau paiement...");
    
    // Si l'email administrateur est vide, ne pas envoyer d'email
    if (!adminEmail || adminEmail.trim() === '') {
      console.log("Email administrateur non défini. Notification admin non envoyée.");
      return true; // On considère comme réussi pour ne pas bloquer le processus
    }
    
    console.log("Service pour emails INITIAUX UNIQUEMENT:", EMAILJS_SERVICE_ID);
    
    const validation = validateEmailData(adminEmail, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }

    const appUrl = window.location.origin;
    const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;

    const templateParams: EmailTemplateParams = {
      to_email: prepareEmailData(adminEmail),
      from_name: "Système d'Inscription IFTAR",
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_phone: participantData.contact_number,
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_method: paymentMethod,
      transaction_reference: transactionReference,
      payment_phone: phoneNumber,
      comments: comments || "Aucun commentaire",
      payment_id: manualPaymentId,
      participant_id: participantData.id,
      app_url: appUrl,
      current_date: new Date().toLocaleString('fr-FR'),
      validation_link: validationLink,
      reply_to: "ne-pas-repondre@lacitadelle.ci",
      prenom: participantData.first_name,
      nom: participantData.last_name,
    };

    // IMPORTANT: N'utilise que le template ADMIN_NOTIFICATION_TEMPLATE_ID pour l'admin
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      ADMIN_NOTIFICATION_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email de notification admin envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email à l'administrateur:", error);
    return false;
  }
};

/**
 * Envoie un email initial au participant
 */
export const sendParticipantInitialEmail = async (participantData: any, paymentMethod: string, phoneNumber: string) => {
  try {
    console.log("===== PRÉPARATION EMAIL INITIAL AU PARTICIPANT =====");
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = prepareEmailData(participantData.email);
    const appUrl = window.location.origin;
    const pendingUrl = `${appUrl}/payment-pending/${participantData.id}?type=initial`;
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    const templateParams: EmailTemplateParams = {
      to_email: email, // UNIQUEMENT l'email du participant
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_phone: participantData.contact_number || "Non disponible",
      status: memberStatus,
      payment_method: paymentMethod,
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_phone: phoneNumber,
      app_url: appUrl,
      pending_url: pendingUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    // IMPORTANT: N'utilise que le template PARTICIPANT_INITIAL_TEMPLATE_ID pour le participant
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      PARTICIPANT_INITIAL_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email initial au participant envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email initial au participant:", error);
    return false;
  }
};
