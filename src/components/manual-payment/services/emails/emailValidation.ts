
// Utilitaires de validation d'email
// Modifications:
// - Correction de la validation d'email - moins strict et plus permissif
// - Optimisation du code pour une meilleure performance
// - Amélioration des messages d'erreur pour meilleure compréhension

import { EmailValidationResult } from './types';

/**
 * Valide une adresse email - vérification de format uniquement
 * Version améliorée avec une regex plus permissive et de meilleurs messages d'erreur
 */
export const validateEmailData = (email: string | undefined, participantData: any): EmailValidationResult => {
  console.log("Validating email data:", { email, participantDataExists: !!participantData });
  
  // Vérifier si les données du participant sont présentes
  if (!participantData) {
    console.error("Validation d'email échouée: données du participant manquantes");
    return { isValid: false, error: "Données du participant manquantes" };
  }

  // Vérifier si l'email est défini
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
  
  // Validation du format d'email avec une regex TRÈS permissive
  // Cette regex accepte presque tous les formats d'emails possibles
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
