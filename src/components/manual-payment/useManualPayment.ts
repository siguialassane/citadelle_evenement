
// Ce hook gère la logique du paiement manuel
// Mise à jour: Restructuration en modules plus petits pour une meilleure maintenance
// Correction: Validation des adresses email avant envoi pour éviter les erreurs 422
// Mise à jour: Suppression de la référence de transaction
// Mise à jour: Email administrateur dynamique géré dans EmailJS
// Mise à jour: Ajout de logs supplémentaires pour le débogage des emails
// Mise à jour: Amélioration de la gestion des erreurs d'email

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { PAYMENT_AMOUNT } from "./config";
import { PaymentMethod, Participant, CopyStates } from "./types";
import { sendParticipantInitialEmail, sendAdminNotification } from "./services/emailService";
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

  // Vérifier si l'email du participant est valide
  const validateParticipantEmail = () => {
    if (!participant?.email) {
      console.error("Email du participant manquant:", participant);
      return false;
    }
    
    const emailTrimmed = participant.email.trim();
    if (!emailTrimmed) {
      console.error("Email du participant vide après nettoyage:", participant.email);
      return false;
    }
    
    // Validation simplifiée du format d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      console.error("Format d'email du participant invalide:", emailTrimmed);
      return false;
    }
    
    return true;
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
        setIsProcessing(false);
        return;
      }
      
      // Vérification de l'email du participant avant de continuer
      if (!validateParticipantEmail()) {
        toast({
          title: "Email invalide",
          description: "L'adresse email du participant est invalide. Veuillez contacter l'administrateur.",
          variant: "destructive",
        });
        setIsProcessing(false);
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
      const adminNotified = await sendAdminNotification(
        manualPayment.id,
        participant,
        paymentMethod,
        phoneNumber,
        comments
      );
      
      if (!adminNotified) {
        console.warn("La notification à l'administrateur n'a pas pu être envoyée");
      }

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
