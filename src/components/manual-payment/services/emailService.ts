
// Ce service gère l'envoi des emails initiaux et de rejet dans l'application
// Mise à jour: Correction du montant affiché dans les emails à 30000 XOF
// Correction: Ajout de paramètres supplémentaires pour garantir la redirection correcte
// Mise à jour: Ajout du lien Google Maps pour la localisation de l'événement
// Mise à jour: Séparation claire entre les emails initiaux et les emails de rejet
// Mise à jour: Utilisation de services dédiés pour chaque type d'email
// Mise à jour: NOUVEAU SERVICE dédié exclusivement aux emails de rejet

import emailjs from '@emailjs/browser';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_INITIAL_TEMPLATE_ID,
  ADMIN_NOTIFICATION_TEMPLATE_ID,
  REJECTION_TEMPLATE_ID,
  PAYMENT_AMOUNT,
  EVENT_LOCATION,
  REJECTION_EMAILJS_SERVICE_ID,
  REJECTION_EMAILJS_PUBLIC_KEY
} from "../config";

/**
 * Envoie un email à l'administrateur pour notifier d'un nouveau paiement
 * Utilise UNIQUEMENT le service pour les emails initiaux
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
    console.log("Utilisation du service pour emails INITIAUX UNIQUEMENT:", EMAILJS_SERVICE_ID);
    
    // URL de base de l'application
    const appUrl = window.location.origin;
    const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;
    const currentDate = new Date().toLocaleString('fr-FR');

    // Envoi d'email à l'administrateur
    const templateParams = {
      to_email: adminEmail.trim(),
      from_name: "Système d'Inscription IFTAR",
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_phone: participantData.contact_number,
      payment_amount: `${PAYMENT_AMOUNT} XOF`, // Utilisation de la constante de configuration
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

    console.log("Envoi de l'email à l'administrateur - service initial uniquement...");
    console.log("Service EmailJS initial:", EMAILJS_SERVICE_ID);
    console.log("Template admin initial:", ADMIN_NOTIFICATION_TEMPLATE_ID);
    console.log("Clé publique initiale:", EMAILJS_PUBLIC_KEY);
    console.log("URL de validation admin:", validationLink);

    // Envoyer l'email à l'administrateur avec le service dédié aux emails INITIAUX
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
 * Utilise UNIQUEMENT le service pour les emails initiaux
 */
export const sendParticipantInitialEmail = async (participantData: any, paymentMethod: string, phoneNumber: string) => {
  try {
    console.log("===== PRÉPARATION EMAIL INITIAL AU PARTICIPANT =====");
    console.log("Utilisation du service pour emails INITIAUX UNIQUEMENT:", EMAILJS_SERVICE_ID);
    
    // Vérification améliorée de l'email
    if (!participantData || !participantData.email) {
      console.error("Données du participant ou email manquants");
      return false;
    }
    
    // Traitement amélioré de l'email
    const email = participantData.email.trim();
    console.log("Email utilisé pour l'envoi initial (après trim):", email);
    
    // Vérification supplémentaire pour éviter l'erreur "recipient address is empty"
    if (!email || email === '') {
      console.error("Email vide après trim()");
      return false;
    }
    
    const appUrl = window.location.origin;
    // URL améliorée pour la page en attente (ajout de type=initial)
    const pendingUrl = `${appUrl}/payment-pending/${participantData.id}?type=initial`;
    
    // URL Google Maps pour la localisation de l'événement
    const eventLocationUrl = EVENT_LOCATION.mapsUrl;
    console.log("URL de localisation Google Maps:", eventLocationUrl);
    
    const participantTemplateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      payment_method: paymentMethod,
      payment_amount: `${PAYMENT_AMOUNT} XOF`, // Utilisation de la constante de configuration
      payment_phone: phoneNumber,
      app_url: appUrl,
      pending_url: pendingUrl,
      maps_url: eventLocationUrl, // URL Google Maps
      event_location: EVENT_LOCATION.name, // Nom du lieu
      event_address: EVENT_LOCATION.address, // Adresse complète
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Envoi de l'email initial au participant - service initial uniquement...");
    console.log("Service EmailJS initial:", EMAILJS_SERVICE_ID);
    console.log("Template participant initial:", PARTICIPANT_INITIAL_TEMPLATE_ID);
    console.log("Clé publique initiale:", EMAILJS_PUBLIC_KEY);

    // Envoi avec EmailJS - service dédié aux emails INITIAUX
    const participantResponse = await emailjs.send(
      EMAILJS_SERVICE_ID, // Service dédié aux emails INITIAUX UNIQUEMENT
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

/**
 * Envoie un email d'échec au participant pour l'informer que son paiement a été rejeté
 * Utilise EXCLUSIVEMENT le service dédié aux emails de rejet
 */
export const sendPaymentRejectionEmail = async (participantData: any, rejectionReason: string = '') => {
  try {
    console.log("===== PRÉPARATION EMAIL D'ÉCHEC DE PAIEMENT AU PARTICIPANT =====");
    console.log("Utilisation EXCLUSIVE du nouveau service pour emails de REJET:", REJECTION_EMAILJS_SERVICE_ID);
    
    // Vérification améliorée de l'email
    if (!participantData || !participantData.email) {
      console.error("Données du participant ou email manquants");
      return false;
    }
    
    // Traitement amélioré de l'email
    const email = participantData.email.trim();
    console.log("Email utilisé pour l'envoi de notification d'échec (après trim):", email);
    
    // Vérification supplémentaire pour éviter l'erreur "recipient address is empty"
    if (!email || email === '') {
      console.error("Email vide après trim()");
      return false;
    }
    
    const appUrl = window.location.origin;
    // URL pour rediriger vers la page d'accueil ou de nouveau paiement
    const tryAgainUrl = `${appUrl}/payment/${participantData.id}`;
    
    const participantTemplateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      rejection_reason: rejectionReason || "Le paiement n'a pas pu être vérifié ou confirmé",
      app_url: appUrl,
      try_again_url: tryAgainUrl,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Envoi de l'email d'échec au participant - NOUVEAU service dédié au REJET...");
    console.log("Service EmailJS pour rejet:", REJECTION_EMAILJS_SERVICE_ID);
    console.log("Template échec de paiement:", REJECTION_TEMPLATE_ID);
    console.log("Clé publique pour rejet:", REJECTION_EMAILJS_PUBLIC_KEY);

    // Utilisation du NOUVEAU service dédié UNIQUEMENT pour les emails de rejet
    const rejectionResponse = await emailjs.send(
      REJECTION_EMAILJS_SERVICE_ID, // NOUVEAU service dédié aux emails de REJET uniquement
      REJECTION_TEMPLATE_ID,
      participantTemplateParams,
      REJECTION_EMAILJS_PUBLIC_KEY
    );

    console.log("Email d'échec au participant envoyé avec succès via le NOUVEAU service:", rejectionResponse);
    return true;
  } catch (emailError) {
    console.error("Erreur lors de l'envoi de l'email d'échec au participant:", emailError);
    console.error("Détails de l'erreur:", emailError);
    return false;
  }
};
