
// Service d'envoi d'emails pour la validation des paiements
// Mise à jour: Correction de l'utilisation des services EmailJS
// Mise à jour: Ajout du QR code dans l'email
// Mise à jour: Ajout du statut de membre et du numéro de téléphone dans l'email
// Mise à jour: Correction pour utiliser exclusivement le service de confirmation
// Mise à jour: Correction du problème d'authentification Gmail API
// Mise à jour: Ajout de logs pour vérifier les URLs
// Mise à jour: Utilisation des URLs de redirection pour éviter les problèmes de template non remplacé

import emailjs from '@emailjs/browser';
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID,
  CONFIRMATION_TEMPLATE_ID,
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  EVENT_LOCATION
} from '@/components/manual-payment/config';
import { validateEmailData, prepareEmailData } from '@/components/manual-payment/services/emails/emailValidation';

/**
 * Envoie un email de confirmation au participant une fois son paiement validé
 */
export const sendConfirmationEmail = async (participantData: any) => {
  try {
    console.log("===== PRÉPARATION EMAIL DE CONFIRMATION =====");
    
    // Valider les données du participant
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error("Validation de l'email échouée:", validation.error);
      return false;
    }
    
    // Préparer l'email pour éviter les problèmes de formatage
    const email = prepareEmailData(participantData.email);
    
    // Générer les URLs utilisées dans l'email
    const appUrl = window.location.origin;
    const confirmationPageUrl = `${appUrl}/confirmation/${participantData.id}`;
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    const receiptUrl = `${appUrl}/redirect/receipt/${participantData.id}`;
    
    // Ajout de logs pour vérifier les URLs
    console.log("URLs générées pour l'email de confirmation:", {
      confirmationUrl: confirmationPageUrl,
      encodedUrl: encodedConfirmationUrl,
      qrCodeUrl: qrCodeImageUrl,
      receiptUrl: receiptUrl,
      mapsUrl: EVENT_LOCATION.mapsUrl
    });
    
    // Formatage du statut de membre
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    // Préparation des paramètres pour le template EmailJS
    const templateParams = {
      to_email: email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2025",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      email: participantData.email,
      tel: participantData.contact_number || "Non disponible",
      status: memberStatus,
      participant_id: participantData.id,
      qr_code_url: qrCodeImageUrl,
      app_url: appUrl,
      confirmation_url: confirmationPageUrl,
      receipt_url: receiptUrl,
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      current_date: new Date().toLocaleString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    // Ajouter un log pour vérifier les paramètres de configuration
    console.log("EmailJS configuration pour email de confirmation:", {
      service_id: CONFIRMATION_EMAILJS_SERVICE_ID,
      template_id: CONFIRMATION_TEMPLATE_ID,
      params_count: Object.keys(templateParams).length
    });
    
    // Initialisation explicite pour éviter les problèmes d'authentification
    emailjs.init(CONFIRMATION_EMAILJS_PUBLIC_KEY);
    
    const response = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID,
      templateParams
    );
    
    console.log("Email de confirmation envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    return false;
  }
};
