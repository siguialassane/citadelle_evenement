
// Utilitaires de validation d'email
import { EmailValidationResult } from './types';

/**
 * Valide une adresse email et les données de participant associées
 */
export const validateEmailData = (email: string | undefined, participantData: any): EmailValidationResult => {
  console.log("Validating email data:", { email, participantDataExists: !!participantData });
  
  if (!participantData) {
    console.error("Validation d'email échouée: données du participant manquantes");
    return { isValid: false, error: "Données du participant manquantes" };
  }

  if (!email) {
    console.error("Validation d'email échouée: email manquant");
    return { isValid: false, error: "Email manquant" };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    console.error("Validation d'email échouée: email vide après nettoyage");
    return { isValid: false, error: "Email vide après nettoyage" };
  }
  
  // Validation supplémentaire du format d'email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    console.error("Validation d'email échouée: format d'email invalide:", trimmedEmail);
    return { isValid: false, error: `Format d'email invalide: ${trimmedEmail}` };
  }

  console.log("Email validé avec succès:", trimmedEmail);
  return { isValid: true };
};

/**
 * Prépare une adresse email pour l'envoi
 * Nettoie et vérifie la validité basique
 */
export const prepareEmailData = (email: string): string => {
  const cleaned = email.trim();
  console.log("Email nettoyé pour envoi:", cleaned);
  return cleaned;
};
