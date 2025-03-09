
// Service pour la validation des paiements
// Mise à jour: Modification pour corriger le problème d'envoi simultané d'emails
// ATTENTION: Le code responsable des envois d'emails après paiement a été isolé temporairement

import { toast } from "@/hooks/use-toast";
import { ValidationResponse, EmailConfirmationParams } from "./types";
import { 
  validatePaymentInDatabase, 
  fetchParticipantData 
} from "./supabaseService";
import emailjs from '@emailjs/browser';
import { 
  CONFIRMATION_EMAILJS_SERVICE_ID,
  CONFIRMATION_EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID,
  ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
  ADMIN_EMAIL
} from "@/components/manual-payment/config";

// Valide un paiement et envoie les emails nécessaires
// Cette fonction est UNIQUEMENT appelée par l'administrateur lors de la validation explicite d'un paiement
export const validatePayment = async (paymentId: string, paymentData: any): Promise<ValidationResponse> => {
  try {
    console.log("==== DÉBUT DU PROCESSUS DE VALIDATION DE PAIEMENT (ADMIN UNIQUEMENT) ====");
    console.log(`Validation du paiement ID: ${paymentId} par l'administrateur`);
    
    if (!paymentData) {
      console.error("Données de paiement introuvables pour l'ID:", paymentId);
      throw new Error("Données de paiement manquantes");
    }
    
    // Vérifier si le paiement est déjà validé pour éviter les doubles envois
    if (paymentData.status === 'completed') {
      console.log("Ce paiement a déjà été validé, aucune action supplémentaire nécessaire");
      toast({
        title: "Information",
        description: "Ce paiement a déjà été validé précédemment.",
        variant: "default",
      });
      return { success: true };
    }
    
    // Mettre à jour le statut du paiement et générer le QR code
    const { qrCodeId, participantId } = await validatePaymentInDatabase(paymentId);
    
    // Récupérer les données complètes du participant
    const participantData = await fetchParticipantData(participantId);
    
    console.log("Données du participant récupérées:", participantData);
    console.log("Email du participant:", participantData.email);

    // Vérification simple de l'email
    if (!participantData.email) {
      console.error("Email du participant manquant");
      throw new Error("Email du participant manquant");
    }

    // NOUVEAU CODE SIMPLIFIÉ POUR L'ENVOI D'EMAIL - UNIQUEMENT APRÈS VALIDATION ADMIN
    console.log("=== ENVOI D'EMAIL DE CONFIRMATION APRÈS VALIDATION ADMIN ===");
    
    try {
      // Envoi direct de l'email de confirmation avec le Service #2
      const email = participantData.email.trim();
      console.log("Email utilisé pour l'envoi de confirmation:", email);
      
      // Construction de l'URL du QR code
      const appUrl = window.location.origin;
      const qrCodeData = `${appUrl}/confirmation/${participantData.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
      
      // Détermination du statut pour l'affichage
      const statut = participantData.is_member ? "Membre" : "Non-membre";
      
      // Préparation des paramètres pour le template d'email
      const templateParams = {
        to_email: email,
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        from_name: "IFTAR 2024",
        prenom: participantData.first_name,
        nom: participantData.last_name,
        participant_email: email,
        participant_phone: participantData.contact_number,
        participant_name: `${participantData.first_name} ${participantData.last_name}`,
        tel: participantData.contact_number,
        status: statut,
        qr_code_url: qrCodeUrl,
        participant_id: participantData.id,
        app_url: appUrl,
        receipt_url: `${appUrl}/confirmation/${participantData.id}`,
        badge_url: `${appUrl}/confirmation/${participantData.id}`,
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("ENVOI D'EMAIL DE CONFIRMATION - ADMIN UNIQUEMENT");
      console.log("- Service EmailJS:", CONFIRMATION_EMAILJS_SERVICE_ID);
      console.log("- Template confirmation:", CONFIRMATION_TEMPLATE_ID);
      console.log("- Clé publique:", CONFIRMATION_EMAILJS_PUBLIC_KEY);
      
      // Envoi de l'email de confirmation avec EmailJS
      const emailResponse = await emailjs.send(
        CONFIRMATION_EMAILJS_SERVICE_ID,
        CONFIRMATION_TEMPLATE_ID,
        templateParams,
        CONFIRMATION_EMAILJS_PUBLIC_KEY
      );
      
      console.log("✅ Email de confirmation envoyé avec succès:", emailResponse);
      
      // Envoi de la notification à l'administrateur
      const adminNotifParams = {
        to_email: ADMIN_EMAIL,
        from_name: "Système d'Inscription IFTAR",
        admin_name: "Administrateur",
        participant_name: `${participantData.first_name} ${participantData.last_name}`,
        participant_email: email,
        participant_phone: participantData.contact_number,
        status: statut,
        payment_method: paymentData.payment_method,
        payment_amount: `${paymentData.amount} XOF`,
        payment_id: paymentId,
        app_url: window.location.origin,
        validation_time: new Date().toLocaleString('fr-FR'),
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };
      
      // Envoi de la notification admin
      const adminNotifResponse = await emailjs.send(
        CONFIRMATION_EMAILJS_SERVICE_ID,
        ADMIN_CONFIRMATION_NOTIFICATION_TEMPLATE_ID,
        adminNotifParams,
        CONFIRMATION_EMAILJS_PUBLIC_KEY
      );
      
      console.log("✅ Email de notification admin envoyé avec succès:", adminNotifResponse);
      
    } catch (emailError: any) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
      toast({
        title: "Attention",
        description: "Le paiement a été validé mais l'envoi de l'email de confirmation a échoué.",
        variant: "destructive",
      });
    }

    // Notification de succès à l'admin
    toast({
      title: "Paiement validé avec succès",
      description: `Un email de confirmation a été envoyé à ${participantData.email}`,
      variant: "default",
    });
    
    console.log("==== FIN DU PROCESSUS DE VALIDATION DE PAIEMENT ====");
    return { success: true };

  } catch (error: any) {
    console.error("Erreur lors de la validation du paiement:", error);
    toast({
      title: "Erreur",
      description: error.message || "Une erreur est survenue lors de la validation du paiement",
      variant: "destructive",
    });
    return { success: false, error: error.message };
  }
};

// Rejette un paiement
export const rejectPayment = async (paymentId: string): Promise<ValidationResponse> => {
  try {
    const result = await import("./supabaseService").then(module => 
      module.rejectPaymentInDatabase(paymentId)
    );

    if (!result.success) {
      throw new Error(result.error || "Erreur lors du rejet du paiement");
    }

    toast({
      title: "Paiement rejeté avec succès",
      description: "Le paiement a été rejeté et le participant sera notifié.",
      variant: "default",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors du rejet du paiement:", error);
    toast({
      title: "Erreur",
      description: error.message || "Une erreur est survenue lors du rejet du paiement",
      variant: "destructive",
    });
    return { success: false, error: error.message };
  }
};
