
// Service d'envoi d'emails pour le rejet des demandes d'adhésion
// Mise à jour: Ajout du service de rejet pour les adhésions

import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber } from '@/utils/formatUtils';

/**
 * Envoie un email de rejet au demandeur d'adhésion
 */
export const sendMembershipRejectionEmail = async (membershipData: any, rejectionReason: string = '') => {
  try {
    console.log("===== PRÉPARATION EMAIL DE REJET D'ADHÉSION =====");
    
    // Valider les données de l'email
    const validation = validateEmailData(membershipData?.email, membershipData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    // Préparer l'email
    const email = prepareEmailData(membershipData.email);
    
    // Construction de l'URL complète
    const appUrl = window.location.origin;
    const tryAgainUrl = `${appUrl}/membership`;
    
    console.log("Email du destinataire:", email);
    console.log("Nom du destinataire:", `${membershipData.first_name} ${membershipData.last_name}`);
    console.log("Raison du rejet:", rejectionReason || "La demande ne correspond pas à nos critères actuels");
    
    // Année courante pour le template
    const currentYear = new Date().getFullYear();
    
    // Formater le numéro de téléphone pour l'affichage
    const formattedPhone = formatPhoneNumber(membershipData.contact_number);
    
    const templateParams: EmailTemplateParams = {
      to_email: email,
      to_name: `${membershipData.first_name} ${membershipData.last_name}`,
      from_name: "LA CITADELLE",
      prenom: membershipData.first_name,
      nom: membershipData.last_name,
      rejection_reason: rejectionReason || "La demande ne correspond pas à nos critères actuels",
      app_url: appUrl,
      try_again_url: tryAgainUrl,
      contact_phone: "+225 07 07 07 07 07",
      contact_email: "club.lacitadelle@gmail.com",
      current_year: currentYear.toString(),
      reply_to: "club.lacitadelle@gmail.com"
    };

    // Logs pour débogage
    console.log("Paramètres de l'email de rejet:", {
      to_email: templateParams.to_email,
      prenom: templateParams.prenom,
      nom: templateParams.nom,
      rejection_reason: templateParams.rejection_reason
    });

    // Envoi de l'email
    const response = await emailjs.send(
      "service_1gvwp2w", // ID du service pour les adhésions
      "template_kjr7a9j", // ID du template de rejet d'adhésion
      templateParams,
      "wdtFy3bjHd5FNRQLg" // Clé publique API (à remplacer par votre clé)
    );

    console.log("Email de rejet d'adhésion envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de rejet d'adhésion:", error);
    toast({
      title: "Erreur",
      description: "Impossible d'envoyer l'email de rejet au demandeur.",
      variant: "destructive",
    });
    return false;
  }
};
