
// Service pour la validation des paiements
// Créé lors de la refactorisation du hook usePaymentValidation pour isoler la logique de validation
// Mise à jour: Amélioration de la validation de l'email et des journaux détaillés

import { toast } from "@/hooks/use-toast";
import { ValidationResponse, EmailConfirmationParams } from "./types";
import { 
  validatePaymentInDatabase, 
  fetchParticipantData 
} from "./supabaseService";
import { 
  sendConfirmationEmail, 
  sendAdminNotification, 
  validateEmail 
} from "./emailService";

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
    
    console.log("Données complètes du participant récupérées:", {
      id: participantData.id,
      email: participantData.email,
      first_name: participantData.first_name,
      last_name: participantData.last_name,
      qr_code_id: participantData.qr_code_id
    });

    // Vérification directe que l'email existe sans utiliser la validation complexe
    if (!participantData.email) {
      console.error("Email du participant manquant dans les données récupérées");
      throw new Error("Email du participant manquant");
    }

    // Envoi de l'email de confirmation APRÈS avoir tout validé et mis à jour en base
    console.log("=== PRÉPARATION DE L'ENVOI D'EMAIL DE CONFIRMATION ===");
    
    try {
      // Envoi de l'email de confirmation avec QR code
      const emailSuccess = await sendConfirmationEmail(participantData, qrCodeId);
      
      if (emailSuccess) {
        console.log("✅ Email de confirmation envoyé avec succès");
        
        // Notification à l'administrateur que l'email a été envoyé au participant
        const notificationParams: EmailConfirmationParams = {
          participantId: participantData.id,
          participantEmail: participantData.email,
          participantName: `${participantData.first_name} ${participantData.last_name}`,
          participantPhone: participantData.contact_number,
          amount: paymentData.amount,
          paymentMethod: paymentData.payment_method,
          paymentId: paymentId,
          isMember: participantData.is_member,
          qrCodeId: qrCodeId
        };
        
        await sendAdminNotification(notificationParams);
      } else {
        console.error("❌ L'email de confirmation n'a pas pu être envoyé");
        // Ne pas bloquer le processus si l'email échoue, mais notifier l'admin
        toast({
          title: "Attention",
          description: "Le paiement a été validé mais l'envoi de l'email de confirmation a échoué. Veuillez contacter le participant manuellement.",
          variant: "default",
        });
      }
    } catch (emailError: any) {
      console.error("Erreur détaillée lors de l'envoi de l'email de confirmation:", emailError);
      console.error("Message d'erreur:", emailError.message);
      // Ne pas bloquer la validation à cause d'un problème d'email
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
    console.error("Message d'erreur complet:", error.message);
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
