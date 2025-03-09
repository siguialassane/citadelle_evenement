
// Service pour l'envoi d'emails de confirmation et de notification
// Mise à jour: Correction du problème d'envoi d'email - Simplification radicale du traitement des emails

import emailjs from '@emailjs/browser';
import { 
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
  ADMIN_EMAIL
} from "@/components/manual-payment/config";
import { EmailConfirmationParams } from './types';

// Envoie un email de confirmation au participant avec le QR code
export const sendConfirmationEmail = async (
  participantData: any, 
  qrCodeId: string
): Promise<boolean> => {
  try {
    console.log("===== ENVOI EMAIL DE CONFIRMATION AVEC QR CODE =====");
    
    // Validation simplifiée - Vérification de base
    if (!participantData || !participantData.email) {
      console.error("ERREUR CRITIQUE: Données du participant ou email manquants");
      console.error("Participant data:", participantData);
      return false;
    }
    
    // Utilisation directe de l'email avec trim() - comme dans sendParticipantInitialEmail
    const email = participantData.email.trim();
    console.log("Email utilisé pour l'envoi de confirmation:", email);
    
    // Log de vérification avant l'envoi
    if (!email || email === '') {
      console.error("ERREUR: Email vide après trim()");
      return false;
    }
    
    // Récupération de l'URL de base de l'application
    const appUrl = window.location.origin;
    
    // Détermination du statut pour l'affichage
    const statut = participantData.is_member ? "Membre" : "Non-membre";
    
    // Construction de l'URL du QR code
    const qrCodeData = `${appUrl}/confirmation/${participantData.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
    
    console.log("DEBUG - Données pour template email:");
    console.log("- Email:", email);
    console.log("- Nom:", `${participantData.first_name} ${participantData.last_name}`);
    console.log("- URL QR code:", qrCodeUrl);
    
    // Préparation des paramètres pour le template
    const templateParams = {
      to_email: email, // Utilisation directe de l'email nettoyé
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2024",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      tel: participantData.contact_number,
      status: statut,
      qr_code_url: qrCodeUrl,
      participant_id: participantData.id,
      app_url: appUrl,
      receipt_url: `${appUrl}/confirmation/${participantData.id}`,
      badge_url: `${appUrl}/confirmation/${participantData.id}`,
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    console.log("Tentative d'envoi avec EmailJS (CONFIG UNIFIÉE)...");
    console.log("- Service:", EMAILJS_SERVICE_ID);
    console.log("- Template:", CONFIRMATION_TEMPLATE_ID);
    console.log("- Destinataire:", templateParams.to_email);

    // Envoi direct avec EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      CONFIRMATION_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("Réponse EmailJS:", response);
    console.log("Email de confirmation envoyé avec succès");
    return true;
  } catch (error: any) {
    console.error("ERREUR DÉTAILLÉE lors de l'envoi de l'email de confirmation:", error);
    console.error("Message d'erreur:", error.message);
    
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
    
    // Vérification de l'email 
    const participantEmail = params.participantEmail.trim();
    console.log("Email participant utilisé pour notification admin:", participantEmail);
    
    const adminNotifParams = {
      to_email: ADMIN_EMAIL,
      from_name: "Système d'Inscription IFTAR",
      admin_name: "Administrateur",
      participant_name: params.participantName,
      participant_email: participantEmail,
      status: params.isMember ? "Membre" : "Non-membre",
      payment_method: params.paymentMethod,
      payment_amount: `${params.amount} XOF`,
      payment_id: params.paymentId,
      app_url: window.location.origin,
      validation_time: new Date().toLocaleString('fr-FR'),
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };
    
    console.log("Notification admin avec service unifié...");
    console.log("- Destinataire admin:", adminNotifParams.to_email);
    
    const adminNotifResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
      adminNotifParams,
      EMAILJS_PUBLIC_KEY
    );
    
    console.log("Email de notification admin envoyé avec succès:", adminNotifResponse);
    return true;
  } catch (adminNotifError: any) {
    console.error("Erreur lors de l'envoi de la notification admin:", adminNotifError);
    console.error("Message d'erreur:", adminNotifError.message);
    // Ne pas bloquer le processus si cette notification échoue
    return false;
  }
};

// Fonction simplifiée pour vérifier si un email est valide
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  email = email.trim();
  return email.length > 0 && email.includes('@');
};
