
// Utilitaires de validation d'email
// Modifications:
// - Suppression de toutes les vérifications d'unicité 
// - Simplification de la validation - uniquement format basique
// - Ne vérifie plus si l'email correspond à un participant existant
// - Aucune vérification d'unicité

import { EmailValidationResult } from './types';

/**
 * Valide une adresse email - vérification de format uniquement
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

  // Nettoyage approfondi de l'email pour éliminer tout espace
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    console.error("Validation d'email échouée: email vide après nettoyage");
    return { isValid: false, error: "Email vide après nettoyage" };
  }
  
  // Validation du format d'email avec une regex plus permissive
  // Accepte différents domaines (gmail, yahoo, hotmail, etc.) et formats
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
  // Nettoyage approfondi pour éliminer tous les espaces
  const cleaned = email.trim();
  console.log("Email nettoyé pour envoi:", cleaned);
  return cleaned;
};
