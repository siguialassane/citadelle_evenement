
// Service pour la validation des paiements manuels
// Mise à jour: Séparation complète des chemins d'envoi d'emails
// Mise à jour: Services EmailJS dédiés pour chaque type d'email
// Mise à jour: Nouveau service distinct pour les emails de rejet
// Mise à jour: Construction explicite d'URLs complètes

import { toast } from "@/hooks/use-toast";
import { ValidationResponse } from "./types";
import { 
  validatePaymentInDatabase, 
  fetchParticipantData,
  rejectPaymentInDatabase,
  fetchPaymentById
} from "./supabaseService";
import { sendConfirmationEmail } from "./emailService";
import { sendPaymentRejectionEmail } from "@/components/manual-payment/services/emails/rejectionEmailService";

export const validatePayment = async (paymentId: string, paymentData: any): Promise<ValidationResponse> => {
  try {
    console.log("==== DÉBUT DU PROCESSUS DE VALIDATION UNIQUEMENT ====");
    console.log("Service EmailJS pour confirmation (UNIQUEMENT):", "service_is5645q");
    console.log("ID du paiement à valider:", paymentId);
    
    if (!paymentData) {
      throw new Error("Données de paiement manquantes");
    }
    
    // Vérifications du statut
    if (paymentData.status === 'completed') {
      toast({
        title: "Déjà validé",
        description: "Ce paiement a déjà été validé précédemment.",
      });
      return { success: true, alreadyProcessed: true };
    }
    
    if (paymentData.status === 'rejected') {
      toast({
        title: "Impossible",
        description: "Ce paiement a déjà été rejeté et ne peut pas être validé.",
      });
      return { success: false, alreadyProcessed: true };
    }
    
    // Mise à jour de la base de données AVANT l'envoi d'email
    const { qrCodeId, participantId } = await validatePaymentInDatabase(paymentId);
    console.log("Paiement validé dans la base de données:", paymentId);
    console.log("ID QR Code généré:", qrCodeId);
    console.log("ID du participant:", participantId);
    
    const participantData = await fetchParticipantData(participantId);
    
    if (!participantData?.email) {
      throw new Error("Données du participant incomplètes");
    }

    // UNIQUEMENT envoi de l'email de confirmation
    const emailSuccess = await sendConfirmationEmail(participantData, qrCodeId);
    
    if (!emailSuccess) {
      console.error("Erreur lors de l'envoi de l'email de confirmation");
      toast({
        title: "Attention",
        description: "Paiement validé mais l'email n'a pas pu être envoyé.",
      });
    }

    toast({
      title: "Validation réussie",
      description: "Le participant va recevoir un email de confirmation.",
    });
    
    return { success: true };

  } catch (error: any) {
    console.error("Erreur de validation:", error);
    throw error;
  }
};

export const rejectPayment = async (paymentId: string): Promise<ValidationResponse> => {
  try {
    console.log("==== DÉBUT DU PROCESSUS DE REJET UNIQUEMENT ====");
    console.log("NOUVEAU Service EmailJS pour rejet (UNIQUEMENT):", "service_1gvwp2w");
    console.log("ID du paiement à rejeter:", paymentId);
    
    const paymentData = await fetchPaymentById(paymentId);
    
    if (!paymentData?.participant_id) {
      throw new Error("Données de paiement introuvables");
    }
    
    console.log("ID participant associé au paiement:", paymentData.participant_id);
    
    // Vérifications du statut
    if (paymentData.status === 'completed') {
      toast({
        title: "Impossible",
        description: "Ce paiement a déjà été validé et ne peut pas être rejeté.",
      });
      return { success: false, alreadyProcessed: true };
    }
    
    if (paymentData.status === 'rejected') {
      toast({
        title: "Déjà rejeté",
        description: "Ce paiement a déjà été rejeté précédemment.",
      });
      return { success: true, alreadyProcessed: true };
    }
    
    // Mise à jour de la base de données AVANT l'envoi d'email
    await rejectPaymentInDatabase(paymentId);
    console.log("Paiement rejeté dans la base de données:", paymentId);
    
    const participantData = await fetchParticipantData(paymentData.participant_id);
    
    if (!participantData) {
      throw new Error("Participant introuvable");
    }

    // UNIQUEMENT envoi de l'email de rejet avec le NOUVEAU service
    const emailSuccess = await sendPaymentRejectionEmail(
      participantData,
      "Votre paiement n'a pas pu être validé. Veuillez réessayer."
    );
    
    if (!emailSuccess) {
      console.error("Erreur lors de l'envoi de l'email de rejet");
      toast({
        title: "Attention",
        description: "Paiement rejeté mais l'email n'a pas pu être envoyé.",
      });
    }

    toast({
      title: "Rejet effectué",
      description: "Le participant va recevoir un email de notification.",
    });
    
    return { success: true };

  } catch (error: any) {
    console.error("Erreur de rejet:", error);
    throw error;
  }
};

/**
 * Récupère les détails d'un paiement spécifique
 */
export const fetchPaymentDetails = async (paymentId: string) => {
  try {
    console.log("Récupération des détails du paiement:", paymentId);
    
    // Importer la fonction de supabaseService au lieu d'essayer d'accéder à supabase directement
    const { fetchPaymentById } = await import("./supabaseService");
    const payment = await fetchPaymentById(paymentId);
    
    if (!payment) {
      console.error("Paiement non trouvé pour l'ID:", paymentId);
      throw new Error("Paiement non trouvé");
    }
    
    console.log("Détails du paiement récupérés:", payment);
    return payment;
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du paiement:", error);
    throw error;
  }
};
