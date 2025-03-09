
// Service pour l'envoi d'emails de confirmation et de notification
// Créé lors de la refactorisation du hook usePaymentValidation pour isoler la logique d'envoi d'emails

import emailjs from '@emailjs/browser';
import { 
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
  ADMIN_EMAIL
} from "@/components/manual-payment/config";
import { EmailConfirmationParams } from './types';

// Valide une adresse email
export const validateEmail = (email: string): boolean => {
  if (!email || !email.trim() || !email.includes('@')) {
    console.error("Adresse email invalide:", email);
    return false;
  }
  return true;
};

// Envoie un email de confirmation au participant avec le QR code
export const sendConfirmationEmail = async (
  participantData: any, 
  qrCodeId: string
): Promise<boolean> => {
  try {
    console.log("===== ENVOI EMAIL DE CONFIRMATION AVEC QR CODE =====");
    
    // Validation des données du participant
    if (!participantData || !participantData.email) {
      console.error("Données du participant manquantes ou invalides:", participantData);
      return false;
    }
    
    // Nettoyage et validation de l'email
    const emailAddress = participantData.email.trim();
    if (!validateEmail(emailAddress)) {
      return false;
    }
    
    console.log("Email du destinataire:", emailAddress);
    
    // Récupération de l'URL de base de l'application
    const appUrl = window.location.origin;
    console.log("URL de base de l'application:", appUrl);
    
    // Détermination du statut pour l'affichage
    const statut = participantData.is_member ? "Membre" : "Non-membre";
    console.log("Statut du participant:", statut);
    
    // Construction de l'URL de confirmation avec l'ID du participant
    const confirmationUrl = `${appUrl}/confirmation/${participantData.id}`;
    console.log("URL de confirmation générée:", confirmationUrl);
    
    // Construction de l'URL du QR code avec l'URL complète comme données
    const qrCodeData = `${appUrl}/confirmation/${participantData.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
    console.log("URL du QR code générée:", qrCodeUrl);
    console.log("Données encodées dans le QR code:", qrCodeData);
    
    // Préparation des paramètres pour le template de confirmation avec QR code
    const templateParams = {
      to_email: emailAddress,
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name.trim(),
      nom: participantData.last_name.trim(),
      tel: participantData.contact_number,
      status: statut,
      qr_code_url: qrCodeUrl,
      participant_id: participantData.id,
      app_url: appUrl,
      receipt_url: `${appUrl}/confirmation/${participantData.id}`,
      badge_url: `${appUrl}/confirmation/${participantData.id}`,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Paramètres préparés pour le template d'email:", templateParams);
    console.log("Tentative d'envoi de l'email avec EmailJS (SERVICE UNIFIÉ)...");

    // Utilisation du service et des identifiants unifiés
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Réponse EmailJS:", response);
    console.log("Email de confirmation avec QR code envoyé avec succès");
    return true;
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
    console.error("Message d'erreur spécifique:", error.message);
    
    // Log plus détaillé pour aider au débogage
    if (error.status) {
      console.error("Status de l'erreur:", error.status);
    }
    if (error.text) {
      console.error("Texte de l'erreur:", error.text);
    }
    
    throw error;
  }
};

// Envoie une notification à l'administrateur suite à la validation d'un paiement
export const sendAdminNotification = async (params: EmailConfirmationParams): Promise<boolean> => {
  try {
    console.log("Envoi de notification de confirmation à l'administrateur...");
    
    const adminNotifParams = {
      to_email: ADMIN_EMAIL,
      from_name: "Système d'Inscription IFTAR",
      admin_name: "Administrateur",
      participant_name: params.participantName,
      participant_email: params.participantEmail.trim(),
      status: params.isMember ? "Membre" : "Non-membre",
      payment_method: params.paymentMethod,
      payment_amount: `${params.amount} XOF`,
      payment_id: params.paymentId,
      app_url: window.location.origin,
      validation_time: new Date().toLocaleString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Notification admin de confirmation avec service unifié...");
    console.log("- Service EmailJS:", EMAILJS_SERVICE_ID);
    console.log("- Template admin:", ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID);
    console.log("- Clé publique:", EMAILJS_PUBLIC_KEY);
    
    const adminNotifResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
      adminNotifParams,
      EMAILJS_PUBLIC_KEY
    );
    
    console.log("Email de notification admin (post-confirmation) envoyé avec succès:", adminNotifResponse);
    return true;
  } catch (adminNotifError: any) {
    console.error("Erreur lors de l'envoi de la notification admin post-confirmation:", adminNotifError);
    console.error("Message d'erreur:", adminNotifError.message);
    // Ne pas bloquer le processus si cette notification échoue
    return false;
  }
};
