
// Ce hook gère la logique du paiement manuel
// Mise à jour: Restructuration en modules plus petits pour une meilleure maintenance
// Correction: Validation des adresses email avant envoi pour éviter les erreurs 422
// Mise à jour: Suppression de la référence de transaction
// Mise à jour: Email administrateur dynamique géré dans EmailJS
// Mise à jour: Ajout de logs supplémentaires pour le débogage des emails
// Mise à jour: Correction des importations

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { PAYMENT_AMOUNT } from "./config";
import { PaymentMethod, Participant, CopyStates } from "./types";
import { 
  sendAdminNotification,
  sendParticipantInitialEmail 
} from "./services/emails/initialEmailService";
import { registerManualPayment } from "./services/paymentService";

export function useManualPayment(participant: Participant) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ORANGE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [comments, setComments] = useState("");
  const [isCopied, setIsCopied] = useState<CopyStates>({});
  const navigate = useNavigate();

  // Fonction pour copier du texte dans le presse-papier
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied({ ...isCopied, [key]: true });
      setTimeout(() => {
        setIsCopied({ ...isCopied, [key]: false });
      }, 2000);
    });
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);

      // Validation des champs
      if (!phoneNumber) {
        toast({
          title: "Champ requis",
          description: "Veuillez saisir le numéro utilisé pour le paiement",
          variant: "destructive",
        });
        return;
      }

      // Enregistrer le paiement manuel dans la base de données
      const manualPayment = await registerManualPayment(
        participant.id,
        paymentMethod,
        phoneNumber,
        comments
      );

      console.log("Paiement manuel enregistré avec ID:", manualPayment.id);

      // Envoyer une notification à l'administrateur (email défini dans EmailJS)
      await sendAdminNotification(
        manualPayment.id,
        participant,
        paymentMethod,
        phoneNumber,
        comments
      );

      // Tenter d'envoyer l'email initial au participant
      const participantEmailSent = await sendParticipantInitialEmail(
        participant,
        paymentMethod,
        phoneNumber
      );

      if (!participantEmailSent) {
        console.warn("L'email initial n'a pas pu être envoyé au participant");
        toast({
          title: "Attention",
          description: "Votre paiement a été soumis mais l'email de confirmation n'a pas pu être envoyé. Veuillez vérifier votre adresse email.",
          variant: "destructive",
        });
      } else {
        // Afficher un message de succès
        toast({
          title: "Paiement soumis avec succès",
          description: "Votre demande est en attente de validation par un administrateur. Vous recevrez un email de confirmation une fois validée.",
          variant: "default",
        });
      }

      // Rediriger vers une page d'attente
      setTimeout(() => {
        navigate(`/payment-pending/${participant.id}`);
      }, 2000);

    } catch (error: any) {
      console.error("Erreur lors du traitement du paiement manuel:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    paymentMethod,
    setPaymentMethod,
    phoneNumber,
    setPhoneNumber,
    comments,
    setComments,
    isCopied,
    copyToClipboard,
    handleSubmit
  };
}
