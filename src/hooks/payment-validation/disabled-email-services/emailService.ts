
// DÉSACTIVÉ: Ce service a été temporairement isolé pour résoudre les problèmes d'envoi d'emails multiples
// Il contient l'ancien code du service d'envoi d'emails qui était problématique
// NE PAS UTILISER CE CODE - RÉFÉRENCE UNIQUEMENT

import emailjs from '@emailjs/browser';
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID,
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
  ADMIN_EMAIL
} from "@/components/manual-payment/config";
import { EmailConfirmationParams } from '../types';

// DÉSACTIVÉ: Ancien code d'envoi d'email de confirmation
export const sendConfirmationEmail = async (
  participantData: any, 
  qrCodeId: string
): Promise<boolean> => {
  try {
    console.log("===== ENVOI EMAIL DE CONFIRMATION AVEC QR CODE (SERVICE #2) - DÉSACTIVÉ =====");
    
    // Code désactivé pour éviter les envois d'emails multiples
    console.log("Cette fonction a été désactivée pour déboguer les problèmes d'envois multiples");
    return true;
  } catch (error: any) {
    console.error("ERREUR DÉTAILLÉE lors de l'envoi de l'email de confirmation:", error);
    console.error("Message d'erreur:", error.message);
    throw error;
  }
};

// DÉSACTIVÉ: Ancien code d'envoi de notification à l'administrateur
export const sendAdminNotification = async (params: EmailConfirmationParams): Promise<boolean> => {
  try {
    console.log("Envoi de notification de confirmation à l'administrateur (SERVICE #2) - DÉSACTIVÉ");
    
    // Code désactivé pour éviter les envois d'emails multiples
    console.log("Cette fonction a été désactivée pour déboguer les problèmes d'envois multiples");
    return true;
  } catch (adminNotifError: any) {
    console.error("Erreur lors de l'envoi de la notification admin:", adminNotifError);
    return false;
  }
};

// Fonction simplifiée pour vérifier si un email est valide
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  email = email.trim();
  return email.length > 0 && email.includes('@');
};
