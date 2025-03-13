
import emailjs from '@emailjs/browser';
import { validateEmailData, prepareEmailData } from './emailValidation';
import { EmailTemplateParams } from './types';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_PUBLIC_KEY,
  PARTICIPANT_INITIAL_TEMPLATE_ID,
  ADMIN_NOTIFICATION_TEMPLATE_ID,
  PAYMENT_AMOUNT,
  EVENT_LOCATION
} from "../../config";

/**
 * Envoie un email à l'administrateur pour notifier d'un nouveau paiement
 * L'email du destinataire est désormais géré directement dans le template EmailJS
 */
export const sendAdminNotification = async (
  manualPaymentId: string,
  participantData: any,
  paymentMethod: string,
  phoneNumber: string,
  comments: string
) => {
  try {
    console.log("Envoi de notification à l'administrateur pour nouveau paiement...");
    console.log("Service pour emails INITIAUX UNIQUEMENT:", EMAILJS_SERVICE_ID);
    
    // Vérification des données du participant
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }

    // IMPORTANT: Ne pas utiliser {{app_url}} mais construire l'URL complète ici
    const appUrl = window.location.origin;
    // Construction explicite de l'URL complète pour éviter les problèmes de remplacement
    const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;
    
    // Vérification de l'URL de validation
    console.log("URL de validation admin générée:", validationLink);

    // Formater les données pour s'assurer qu'elles ne sont pas vides
    const formattedComments = comments?.trim() || "Aucun commentaire";
    const formattedPaymentMethod = paymentMethod?.toUpperCase() || "NON SPÉCIFIÉ";
    const formattedPhoneNumber = phoneNumber?.trim() || "NON SPÉCIFIÉ";
    const currentDate = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Préparation des paramètres pour le template EmailJS
    const templateParams: EmailTemplateParams = {
      to_email: 'DYNAMIC_ADMIN_EMAIL', // Valeur fictive, sera remplacée par EmailJS
      from_name: "Système d'Inscription IFTAR 2025",
      participant_name: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email,
      participant_phone: participantData.contact_number || "NON SPÉCIFIÉ",
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_method: formattedPaymentMethod,
      payment_phone: formattedPhoneNumber,
      comments: formattedComments,
      payment_id: manualPaymentId,
      participant_id: participantData.id,
      app_url: appUrl,
      current_date: currentDate,
      validation_link: validationLink, // URL complète déjà construite
      reply_to: "ne-pas-repondre@lacitadelle.ci",
      prenom: participantData.first_name,
      nom: participantData.last_name,
    };
    
    // Ajouter plus de logs pour diagnostiquer le problème d'authentification
    console.log("EmailJS configuration pour admin notification:", {
      service_id: EMAILJS_SERVICE_ID,
      template_id: ADMIN_NOTIFICATION_TEMPLATE_ID,
      params_count: Object.keys(templateParams).length
    });

    // Envoi de l'email via EmailJS avec le template ADMIN_NOTIFICATION_TEMPLATE_ID
    // Utilisation de init() pour éviter les problèmes d'authentification
    emailjs.init(EMAILJS_PUBLIC_KEY);
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      ADMIN_NOTIFICATION_TEMPLATE_ID,
      templateParams
    );

    console.log("Email de notification admin envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email à l'administrateur:", error);
    return false;
  }
};

/**
 * Envoie un email initial au participant
 */
export const sendParticipantInitialEmail = async (participantData: any, paymentMethod: string, phoneNumber: string) => {
  try {
    console.log("===== PRÉPARATION EMAIL INITIAL AU PARTICIPANT =====");
    
    const validation = validateEmailData(participantData?.email, participantData);
    if (!validation.isValid) {
      console.error(validation.error);
      return false;
    }
    
    const email = prepareEmailData(participantData.email);
    
    // IMPORTANT: Ne pas utiliser {{app_url}} mais construire l'URL complète ici
    const appUrl = window.location.origin;
    
    // Construction explicite de l'URL complète pour éviter les problèmes de template
    // On n'utilise plus le format redirect/pending/ mais directement l'URL finale
    const pendingUrl = `${appUrl}/payment-pending/${participantData.id}`;
    const memberStatus = participantData.is_member ? "Membre" : "Non membre";
    
    // Log pour débugger les URLs
    console.log("URLs générées pour l'email initial:", {
      pendingUrl: pendingUrl,
      mapsUrl: EVENT_LOCATION.mapsUrl,
      eventLocation: EVENT_LOCATION.name
    });
    
    // Ajouter des logs pour vérifier les données du participant
    console.log("Données participant pour email initial:", {
      email: email,
      nom_complet: `${participantData.first_name} ${participantData.last_name}`,
      participant_email: participantData.email // Vérifier que cette valeur existe
    });
    
    const templateParams: EmailTemplateParams = {
      to_email: email, // UNIQUEMENT l'email du participant
      to_name: `${participantData.first_name} ${participantData.last_name}`,
      from_name: "IFTAR 2025",
      prenom: participantData.first_name,
      nom: participantData.last_name,
      participant_name: `${participantData.first_name} ${participantData.last_name}`, // Ajouté pour le template
      participant_email: participantData.email, // Ajouté pour le template
      participant_phone: participantData.contact_number || "Non disponible",
      status: memberStatus,
      payment_method: paymentMethod,
      payment_amount: `${PAYMENT_AMOUNT} XOF`,
      payment_phone: phoneNumber,
      app_url: appUrl,
      pending_url: pendingUrl, // URL complète déjà construite
      maps_url: EVENT_LOCATION.mapsUrl,
      event_location: EVENT_LOCATION.name,
      event_address: EVENT_LOCATION.address,
      current_date: new Date().toLocaleString('fr-FR'), // Ajout de la date actuelle formatée
      reply_to: "ne-pas-repondre@lacitadelle.ci"
    };

    // Ajouter un log pour vérifier les paramètres de configuration
    console.log("EmailJS configuration pour email initial:", {
      service_id: EMAILJS_SERVICE_ID,
      template_id: PARTICIPANT_INITIAL_TEMPLATE_ID,
      params_count: Object.keys(templateParams).length
    });

    // Initialisation explicite pour éviter les problèmes d'authentification
    emailjs.init(EMAILJS_PUBLIC_KEY);
    
    // IMPORTANT: N'utilise que le template PARTICIPANT_INITIAL_TEMPLATE_ID pour le participant
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      PARTICIPANT_INITIAL_TEMPLATE_ID,
      templateParams
    );

    console.log("Email initial au participant envoyé avec succès:", response);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email initial au participant:", error);
    return false;
  }
};
