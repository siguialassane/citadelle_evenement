
// Service pour le paiement rapide de participants
// Mise à jour: Implémentation d'un processus de paiement et validation en une seule étape

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validatePaymentInDatabase, fetchParticipantData } from "./supabaseService";
import { sendConfirmationEmail } from "./emailService";
import { v4 as uuidv4 } from "uuid";
import { PAYMENT_AMOUNT } from "@/components/manual-payment/config";

export const performQuickPayment = async (participantId: string, email: string, phoneNumber: string): Promise<boolean> => {
  try {
    console.log("==== DÉBUT DU PROCESSUS DE PAIEMENT RAPIDE ====");
    console.log("ID du participant:", participantId);
    console.log("Email:", email);
    console.log("Numéro de téléphone:", phoneNumber);
    
    // 1. Créer un enregistrement de paiement manuel
    const { data: manualPayment, error: paymentError } = await supabase
      .from('manual_payments')
      .insert({
        participant_id: participantId,
        amount: PAYMENT_AMOUNT,
        payment_method: "WAVE",
        phone_number: phoneNumber.replace("+225", ""),
        comments: "Paiement rapide via admin dashboard",
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Erreur lors de l'enregistrement du paiement rapide:", paymentError);
      throw new Error("Échec de l'enregistrement du paiement rapide. Veuillez réessayer.");
    }

    console.log("Paiement manuel enregistré avec ID:", manualPayment.id);
    
    // 2. Valider le paiement immédiatement
    const { qrCodeId, participantId: validatedParticipantId } = await validatePaymentInDatabase(manualPayment.id);
    console.log("Paiement validé dans la base de données");
    console.log("ID QR Code généré:", qrCodeId);
    console.log("ID du participant confirmé:", validatedParticipantId);
    
    // 3. Récupérer les données complètes du participant
    const participantData = await fetchParticipantData(participantId);
    
    if (!participantData?.email) {
      throw new Error("Données du participant incomplètes");
    }
    
    // 4. Envoyer l'email de confirmation avec le QR code
    const emailSuccess = await sendConfirmationEmail(participantData, qrCodeId);
    
    if (!emailSuccess) {
      console.error("Erreur lors de l'envoi de l'email de confirmation");
      toast({
        title: "Attention",
        description: "Paiement validé mais l'email n'a pas pu être envoyé.",
        variant: "destructive",
      });
      return false;
    }
    
    console.log("Email de confirmation envoyé avec succès");
    return true;
  } catch (error: any) {
    console.error("Erreur lors du paiement rapide:", error);
    toast({
      title: "Erreur",
      description: error.message || "Une erreur est survenue lors du paiement rapide.",
      variant: "destructive",
    });
    return false;
  }
};
