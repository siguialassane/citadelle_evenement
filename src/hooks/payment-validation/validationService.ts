// Service pour la validation des paiements
// Mise à jour: Suppression de l'envoi d'email à l'administrateur après validation
// Amélioration de la journalisation pour le débogage des emails
// Mise à jour: Ajout du lien Google Maps dans l'email de confirmation
// Mise à jour: Ajout de l'envoi d'email d'échec pour les paiements rejetés

import { toast } from "@/hooks/use-toast";
import { ValidationResponse } from "./types";
import { 
  validatePaymentInDatabase, 
  fetchParticipantData,
  rejectPaymentInDatabase
} from "./supabaseService";
import { sendConfirmationEmail } from "./emailService";
import { sendPaymentRejectionEmail } from "@/components/manual-payment/services/emailService";

// Valide un paiement et envoie les emails nécessaires
export const validatePayment = async (paymentId: string, paymentData: any): Promise<ValidationResponse> => {
  try {
    console.log("==== DÉBUT DU PROCESSUS DE VALIDATION DE PAIEMENT ====");
    console.log(`Validation du paiement ID: ${paymentId}`);
    
    if (!paymentData) {
      console.error("Données de paiement introuvables pour l'ID:", paymentId);
      throw new Error("Données de paiement manquantes");
    }
    
    // Mettre à jour le statut du paiement et générer le QR code
    const { qrCodeId, participantId } = await validatePaymentInDatabase(paymentId);
    
    // Récupérer les données complètes du participant
    const participantData = await fetchParticipantData(participantId);
    
    console.log("Données du participant récupérées:", participantData);
    console.log("Email du participant:", participantData.email);
    console.log("Téléphone du participant:", participantData.contact_number);
    console.log("Statut d'adhésion:", participantData.is_member ? "Membre" : "Non-membre");

    // Vérification approfondie des données du participant
    if (!participantData) {
      console.error("Données du participant introuvables");
      throw new Error("Données du participant introuvables");
    }

    if (!participantData.email) {
      console.error("Email du participant manquant");
      throw new Error("Email du participant manquant");
    }

    if (!participantData.first_name || !participantData.last_name) {
      console.error("Nom du participant incomplet");
      throw new Error("Nom du participant incomplet");
    }

    // Envoi de l'email de confirmation APRÈS avoir tout validé
    console.log("=== PRÉPARATION DE L'ENVOI D'EMAIL DE CONFIRMATION ===");
    console.log("Le lien Google Maps sera inclus dans l'email de confirmation");
    
    try {
      // Envoi de l'email de confirmation avec QR code et lien Google Maps
      const emailSuccess = await sendConfirmationEmail(participantData, qrCodeId);
      
      if (emailSuccess) {
        console.log("✅ Email de confirmation envoyé avec succès");
      } else {
        console.error("❌ L'email de confirmation n'a pas pu être envoyé");
        toast({
          title: "Attention",
          description: "Le paiement a été validé mais l'envoi de l'email de confirmation a échoué. Veuillez contacter le participant manuellement.",
          variant: "default",
        });
      }
    } catch (emailError: any) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
      console.error("Détails de l'erreur:", emailError);
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
    console.error("Détails de l'erreur:", error);
    toast({
      title: "Erreur",
      description: error.message || "Une erreur est survenue lors de la validation du paiement",
      variant: "destructive",
    });
    return { success: false, error: error.message };
  }
};

// Rejette un paiement et envoie un email d'échec au participant
export const rejectPayment = async (paymentId: string): Promise<ValidationResponse> => {
  try {
    console.log("==== DÉBUT DU PROCESSUS DE REJET DE PAIEMENT ====");
    console.log(`Rejet du paiement ID: ${paymentId}`);
    
    // Récupérer les données du paiement et du participant avant de rejeter
    // pour pouvoir envoyer l'email ensuite
    const paymentData = await import("./supabaseService").then(module => 
      module.fetchPaymentDetails(paymentId)
    );
    
    if (!paymentData || !paymentData.participant_id) {
      console.error("Données du paiement introuvables pour l'ID:", paymentId);
      throw new Error("Données du paiement manquantes");
    }
    
    // Récupérer les données complètes du participant
    const participantData = await fetchParticipantData(paymentData.participant_id);
    
    console.log("Données du participant récupérées:", participantData);
    
    if (!participantData) {
      console.error("Données du participant introuvables");
      throw new Error("Données du participant introuvables");
    }
    
    // Mettre à jour le statut du paiement dans la base de données
    const result = await rejectPaymentInDatabase(paymentId);

    if (!result.success) {
      throw new Error(result.error || "Erreur lors du rejet du paiement");
    }
    
    console.log("Paiement rejeté avec succès dans la base de données");
    
    // Envoyer l'email d'échec au participant
    try {
      const emailSuccess = await sendPaymentRejectionEmail(
        participantData,
        "Votre paiement a été vérifié mais n'a pas pu être confirmé. Veuillez réessayer ou utiliser une autre méthode de paiement."
      );
      
      if (emailSuccess) {
        console.log("✅ Email d'échec envoyé avec succès au participant");
      } else {
        console.error("❌ L'email d'échec n'a pas pu être envoyé");
        toast({
          title: "Attention",
          description: "Le paiement a été rejeté mais l'envoi de l'email d'échec a échoué. Veuillez contacter le participant manuellement.",
          variant: "default",
        });
      }
    } catch (emailError: any) {
      console.error("Erreur lors de l'envoi de l'email d'échec:", emailError);
      console.error("Détails de l'erreur:", emailError);
      // On continue malgré l'erreur d'email
    }

    toast({
      title: "Paiement rejeté avec succès",
      description: "Le paiement a été rejeté et le participant a été notifié par email.",
      variant: "default",
    });
    
    console.log("==== FIN DU PROCESSUS DE REJET DE PAIEMENT ====");
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
