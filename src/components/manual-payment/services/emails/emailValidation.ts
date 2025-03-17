
// Validation des données pour les services d'email
// Mise à jour: Ajout de fonctions utilitaires pour le traitement des emails

import { EmailValidationResult } from './types';

/**
 * Valide les données d'email avant envoi
 */
export const validateEmailData = (email: string, participantData: any): EmailValidationResult => {
  if (!email) {
    return { 
      isValid: false, 
      error: "Adresse email manquante" 
    };
  }

  if (!email.trim()) {
    return { 
      isValid: false, 
      error: "Adresse email vide après nettoyage" 
    };
  }
  
  // Email regex simple (validation basique)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { 
      isValid: false, 
      error: `Format d'email invalide: ${email}` 
    };
  }
  
  if (!participantData) {
    return { 
      isValid: false, 
      error: "Données du participant manquantes" 
    };
  }
  
  return { isValid: true };
};

/**
 * Prépare et nettoie une adresse email pour l'envoi
 */
export const prepareEmailData = (email: string): string => {
  if (!email) return "";
  return email.trim().toLowerCase();
};

/**
 * Envoie un email personnalisé avec des paramètres spécifiques
 * (Fonctionnalité utilitaire pour d'autres services d'email)
 */
export const sendCustomEmail = async (
  serviceId: string, 
  templateId: string, 
  publicKey: string, 
  templateParams: any
): Promise<boolean> => {
  try {
    // Cette fonction sera implémentée ultérieurement pour centraliser la logique d'envoi
    // Elle sera utilisée par les autres services d'email
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email personnalisé:", error);
    return false;
  }
};
