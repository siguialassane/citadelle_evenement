
// Service d'envoi d'emails pour la validation des paiements
// Mise à jour: Séparation complète des services d'envoi
// Mise à jour: Un seul type d'email par action
// Mise à jour: Ajout du statut de membre et du numéro de téléphone dans l'email
// Mise à jour: Correction pour utiliser exclusivement le service de confirmation

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
    console.log("Template de confirmation exclusif:", CONFIRMATION_TEMPLATE_ID);
    
    // Vérification améliorée de l'email
    if (!participantData || !participantData.email) {
      console.error("Données du participant ou email manquants pour la confirmation");
      return false;
    }
    
    // Traitement amélioré de l'email
    const email = participantData.email.trim();
    console.log("Email utilisé pour l'envoi de confirmation (après trim):", email);
    
    // Vérification supplémentaire pour éviter l'erreur "recipient address is empty"
    if (!email || email === '') {
      console.error("Email vide après trim() pour la confirmation");
      return false;
    }
    
    const appUrl = window.location.origin;
    const confirmationPageUrl = `${appUrl}/confirmation/${qrCodeId}?type=qr&pid=${participantData.id}`;
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    const receiptUrl = `${appUrl}/receipt/${participantData.id}`;
    
    // Formatage du statut de membre
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    const templateParams = {
      to_email: email, // Email du participant uniquement
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_phone: participantData.contact_number || "Non disponible",
      status: memberStatus, // Statut de membre (Membre ou Non membre)
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
