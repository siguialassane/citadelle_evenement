
// Ce service gère l'envoi des emails initiaux dans l'application
// Mise à jour: Clarification de l'utilisation du service général pour les emails non-confirmation
// Correction: Utilisation de Google Charts API pour les QR codes dans tous les emails

import emailjs from '@emailjs/browser';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_INITIAL_TEMPLATE_ID,
  ADMIN_NOTIFICATION_TEMPLATE_ID
} from "../config";

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
    
    // URL de base de l'application
    const appUrl = window.location.origin;
    const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;
    const currentDate = new Date().toLocaleString('fr-FR');

    // Envoi d'email à l'administrateur
    const templateParams = {
      to_email: adminEmail,
      from_name: "Système d'Inscription IFTAR",
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_phone: participantData.contact_number,
      payment_amount: `${1000} XOF`, // Utilisation de la constante directement
      payment_method: paymentMethod,
      transaction_reference: transactionReference,
      payment_phone: phoneNumber,
      comments: comments || "Aucun commentaire",
      payment_id: manualPaymentId,
      participant_id: participantData.id,
      app_url: appUrl,
      current_date: currentDate,
      validation_link: validationLink,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Envoi de l'email à l'administrateur - service général...");
    console.log("Service EmailJS général:", EMAILJS_SERVICE_ID);
    console.log("Template admin initial:", ADMIN_NOTIFICATION_TEMPLATE_ID);
    console.log("Clé publique générale:", EMAILJS_PUBLIC_KEY);
    console.log("URL de validation admin:", validationLink);

    // Envoyer l'email à l'administrateur
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      ADMIN_NOTIFICATION_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email de notification admin initial envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email à l'administrateur:", error);
    return false;
  }
};

/**
 * Envoie un email initial au participant pour l'informer que sa demande est en cours de traitement
 */
export const sendParticipantInitialEmail = async (participantData: any, paymentMethod: string, phoneNumber: string) => {
  try {
    console.log("===== PRÉPARATION EMAIL INITIAL AU PARTICIPANT =====");
    
    // Vérification simplifiée de l'email
    if (!participantData || !participantData.email) {
      console.error("Données du participant ou email manquants");
      return false;
    }
    
    // Traitement direct de l'email
    const email = participantData.email.trim();
    console.log("Email utilisé pour l'envoi initial:", email);
    
    // Vérification supplémentaire
    if (!email || email === '') {
      console.error("Email vide après trim()");
      return false;
    }
    
    const appUrl = window.location.origin;
    const participantTemplateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      payment_method: paymentMethod,
      payment_amount: `${1000} XOF`,
      payment_phone: phoneNumber,
      app_url: appUrl,
      pending_url: `${appUrl}/payment-pending/${participantData.id}`,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Envoi de l'email initial au participant - service général...");
    console.log("Service EmailJS général:", EMAILJS_SERVICE_ID);
    console.log("Template participant initial:", PARTICIPANT_INITIAL_TEMPLATE_ID);
    console.log("Clé publique générale:", EMAILJS_PUBLIC_KEY);
    console.log("Email du destinataire:", email);

    // Envoi avec EmailJS - service général
    const participantResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      PARTICIPANT_INITIAL_TEMPLATE_ID, 
      participantTemplateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Email initial au participant envoyé avec succès:", participantResponse);
    return true;
  } catch (emailError) {
    console.error("Erreur lors de l'envoi de l'email initial au participant:", emailError);
    console.error("Détails de l'erreur:", emailError);
    return false;
  }
};
