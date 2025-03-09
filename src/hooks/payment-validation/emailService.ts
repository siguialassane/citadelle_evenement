
// Service pour l'envoi d'emails de confirmation après validation des paiements
// Mise à jour: Amélioration des URL de QR code avec paramètres plus robustes 
// Ajout de paramètres d'identification supplémentaires pour garantir la redirection correcte

import emailjs from '@emailjs/browser';
import { ADMIN_EMAIL } from "@/components/manual-payment/config";
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID, 
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID
} from "@/components/manual-payment/config";
import { EmailConfirmationParams } from "./types";

/**
 * Envoie un email de confirmation au participant avec son QR code
 */
export const sendConfirmationEmail = async (participantData: any, qrCodeId: string): Promise<boolean> => {
  try {
    console.log("==== PRÉPARATION EMAIL DE CONFIRMATION AVEC QR CODE ====");
    
    if (!participantData.email) {
      console.error("Email du participant manquant");
      return false;
    }
    
    // URL de base et génération des liens
    const appUrl = window.location.origin;
    
    // AMÉLIORATION: URL de la page de confirmation avec paramètres supplémentaires
    // Ajout du type=qr pour indiquer que c'est un accès via QR code
    // Ajout du pid (participantId) pour la redirection si nécessaire
    const confirmationPageUrl = `${appUrl}/confirmation/${qrCodeId}?type=qr&pid=${participantData.id}`;
    console.log("URL de confirmation améliorée:", confirmationPageUrl);
    
    // Génération de l'URL pour l'image QR code avec encodage robuste
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    // Paramètres optimisés: taille 300x300 et marge (qzone) de 2
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    console.log("URL de l'image QR code générée (QR Server API):", qrCodeImageUrl);
    
    // URL du reçu avec l'ID du participant
    const receiptUrl = `${appUrl}/receipt/${participantData.id}`;
    
    const formattedDate = new Date().toLocaleDateString('fr-FR');
    
    console.log("QR Code ID:", qrCodeId);
    console.log("Participant ID:", participantData.id);
    console.log("URL de la page de confirmation:", confirmationPageUrl);
    console.log("URL de l'image QR code:", qrCodeImageUrl);
    console.log("URL du reçu:", receiptUrl);
    console.log("Email du participant:", participantData.email);
    
    // Déterminer le statut du participant
    const status = participantData.is_member ? "Membre" : "Non-membre";
    
    // Préparation des paramètres de l'email - ajustés pour correspondre au template
    const confirmationParams = {
      to_email: participantData.email.trim(),
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_phone: participantData.contact_number,
      from_name: "IFTAR 2024",
      payment_amount: "1000 XOF",
      status: status,
      qr_code_url: qrCodeImageUrl, // URL de l'image QR code pour la balise <img>
      confirmation_url: confirmationPageUrl, // URL directe pour accéder à la page de confirmation
      receipt_url: receiptUrl, // URL pour télécharger le reçu
      confirmation_date: formattedDate,
      app_url: appUrl,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi de l'email de confirmation avec QR code - paramètres:", confirmationParams);
    console.log("Service EmailJS dédié à la confirmation:", CONFIRMATION_EMAILJS_SERVICE_ID);
    console.log("Template confirmation:", CONFIRMATION_TEMPLATE_ID);
    console.log("Clé publique dédiée:", CONFIRMATION_EMAILJS_PUBLIC_KEY);
    
    // Envoi de l'email de confirmation avec le service dédié
    const response = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID, // Utilisation unique de ce template pour la confirmation
      confirmationParams,
      CONFIRMATION_EMAILJS_PUBLIC_KEY
    );
    
    console.log("Email de confirmation envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    console.error("Détails de l'erreur:", error);
    return false;
  }
};

/**
 * Envoie un email de notification à l'administrateur après confirmation d'un paiement
 */
export const sendAdminNotification = async (params: EmailConfirmationParams): Promise<boolean> => {
  try {
    console.log("Envoi de notification à l'administrateur après validation...");
    
    const appUrl = window.location.origin;
    
    // URL de la page de confirmation améliorée
    const confirmationPageUrl = `${appUrl}/confirmation/${params.qrCodeId}?type=qr&pid=${params.participantId}`;
    
    // URL de l'image QR code - utilisant QR Server API avec paramètres optimisés
    const encodedConfirmationUrl = encodeURIComponent(confirmationPageUrl);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedConfirmationUrl}&qzone=2`;
    
    const currentDate = new Date().toLocaleString('fr-FR');
    
    // Paramètres pour l'email admin
    const adminTemplateParams = {
      to_email: ADMIN_EMAIL,
      from_name: "Système de Validation IFTAR",
      participant_name: params.participantName,
      participant_email: params.participantEmail,
      participant_phone: params.participantPhone,
      payment_amount: `${params.amount} XOF`,
      payment_method: params.paymentMethod,
      payment_id: params.paymentId,
      participant_id: params.participantId,
      qr_code_link: confirmationPageUrl,
      qr_code_url: qrCodeImageUrl,
      is_member: params.isMember ? "Oui" : "Non",
      app_url: appUrl,
      current_date: currentDate,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi de la notification admin post-confirmation - paramètres:", adminTemplateParams);
    console.log("Service EmailJS dédié à la confirmation:", CONFIRMATION_EMAILJS_SERVICE_ID);
    console.log("Template admin notification:", ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID);
    
    // Utilisation du même service de confirmation pour la notification admin
    const adminResponse = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
      adminTemplateParams,
      CONFIRMATION_EMAILJS_PUBLIC_KEY
    );
    
    console.log("Email de notification admin après validation envoyé avec succès:", adminResponse);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de notification admin:", error);
    return false;
  }
};
