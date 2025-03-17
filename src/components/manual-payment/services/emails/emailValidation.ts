
// Utilitaires de validation d'email
// Modifications:
// - Correction de la validation d'email - moins strict et plus permissif
// - Optimisation du code pour une meilleure performance
// - Amélioration des messages d'erreur pour meilleure compréhension
// - Ajout de la fonction sendCustomEmail pour centraliser l'envoi d'emails
// - Mise à jour de la fonction sendCustomEmail pour accepter des identifiants de service personnalisés

import emailjs from '@emailjs/browser';
import { EmailTemplateParams, EmailValidationResult, ParticipantEmailData, AdminNotificationEmailData } from './types';
import { 
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_INITIAL_TEMPLATE_ID
} from "../../config";

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

/**
 * Fonction centralisée pour l'envoi d'emails personnalisés
 * Supporte désormais des identifiants de service personnalisés
 */
export const sendCustomEmail = async (
  emailData: ParticipantEmailData | AdminNotificationEmailData, 
  templateId: string,
  serviceId?: string,
  customTemplateId?: string,
  publicKey?: string
): Promise<boolean | { success: number; failed: number }> => {
  try {
    // Utiliser les identifiants personnalisés s'ils sont fournis, sinon utiliser les valeurs par défaut
    const effectiveServiceId = serviceId || EMAILJS_SERVICE_ID;
    const effectiveTemplateId = customTemplateId || templateId || PARTICIPANT_INITIAL_TEMPLATE_ID;
    const effectivePublicKey = publicKey || EMAILJS_PUBLIC_KEY;
    
    console.log(`Envoi d'email avec le service ${effectiveServiceId} et le template ${effectiveTemplateId}...`);
    
    if ('participantEmail' in emailData) {
      // C'est un email pour un participant unique
      const { participantEmail, subject, templateParams } = emailData;
      
      // Vérification de l'email
      if (!participantEmail || !participantEmail.trim()) {
        console.error("Email du participant invalide ou vide");
        return false;
      }
      
      const completeTemplateParams: EmailTemplateParams = {
        to_email: participantEmail.trim(),
        from_name: "LA CITADELLE",
        subject: subject,
        prenom: templateParams.participant_name.split(' ')[0] || "",
        nom: templateParams.participant_name.split(' ').slice(1).join(' ') || "",
        reply_to: "club.lacitadelle@gmail.com",
        app_url: templateParams.website_link,
        ...templateParams
      };
      
      const response = await emailjs.send(
        effectiveServiceId,
        effectiveTemplateId,
        completeTemplateParams,
        effectivePublicKey
      );
      
      console.log("Email envoyé avec succès:", response);
      return true;
    } else {
      // C'est un email pour plusieurs administrateurs
      const { adminEmails, subject, templateParams } = emailData;
      
      if (!adminEmails || adminEmails.length === 0) {
        console.error("Aucune adresse email d'administrateur fournie");
        return { success: 0, failed: 0 };
      }
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const adminEmail of adminEmails) {
        try {
          if (!adminEmail || !adminEmail.trim()) {
            console.warn("Email d'administrateur invalide ou vide, ignoré");
            failedCount++;
            continue;
          }
          
          const completeTemplateParams: EmailTemplateParams = {
            to_email: adminEmail.trim(),
            from_name: "Système d'Inscription LA CITADELLE",
            subject: subject,
            prenom: "Admin",
            nom: "CITADELLE",
            reply_to: "club.lacitadelle@gmail.com",
            app_url: templateParams.admin_action_link.split('/admin')[0],
            ...templateParams
          };
          
          await emailjs.send(
            effectiveServiceId,
            effectiveTemplateId,
            completeTemplateParams,
            effectivePublicKey
          );
          
          successCount++;
        } catch (error) {
          console.error(`Erreur lors de l'envoi à ${adminEmail}:`, error);
          failedCount++;
        }
      }
      
      return { success: successCount, failed: failedCount };
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi d'email personnalisé:", error);
    return false;
  }
};
