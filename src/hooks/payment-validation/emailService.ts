
// Service pour l'envoi d'emails de confirmation après validation des paiements
// Mise à jour: Utilisation du service dédié à la confirmation avec QR code
// Créé pour isoler la logique d'envoi d'emails du reste du service de validation

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
    const qrCodeLink = `${appUrl}/confirmation/${qrCodeId}`;
    const formattedDate = new Date().toLocaleDateString('fr-FR');
    
    console.log("QR Code généré:", qrCodeId);
    console.log("URL du QR Code:", qrCodeLink);
    
    // Préparation des paramètres de l'email
    const confirmationParams = {
      to_email: participantData.email,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      payment_amount: "1000 XOF",
      qr_code_link: qrCodeLink,
      confirmation_date: formattedDate,
      app_url: appUrl,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi de l'email de confirmation avec QR code:", confirmationParams);
    console.log("Service EmailJS dédié à la confirmation:", CONFIRMATION_EMAILJS_SERVICE_ID);
    console.log("Template confirmation:", CONFIRMATION_TEMPLATE_ID);
    console.log("Clé publique dédiée:", CONFIRMATION_EMAILJS_PUBLIC_KEY);
    
    // Envoi de l'email de confirmation avec le service dédié
    const response = await emailjs.send(
      CONFIRMATION_EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID,
      confirmationParams,
      CONFIRMATION_EMAILJS_PUBLIC_KEY
    );
    
    console.log("Email de confirmation envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
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
    const qrCodeLink = `${appUrl}/confirmation/${params.qrCodeId}`;
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
      qr_code_link: qrCodeLink,
      is_member: params.isMember ? "Oui" : "Non",
      app_url: appUrl,
      current_date: currentDate,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Envoi de la notification admin post-confirmation:", adminTemplateParams);
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
