
// Ce hook gère la logique du paiement manuel
// Mise à jour: Restructuration en modules plus petits pour une meilleure maintenance
// Correction: Validation des adresses email avant envoi pour éviter les erreurs 422
// Mise à jour: Suppression de la référence de transaction
// Mise à jour: Email administrateur dynamique géré dans EmailJS
// Mise à jour: Ajout de logs supplémentaires pour le débogage des emails
// Correction: Amélioration de la gestion des erreurs et compatibilité mobile

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
    console.log("Tentative de copie dans le presse-papier:", text);
    
    if (!navigator.clipboard) {
      console.error("API Clipboard non disponible");
      // Fallback pour les appareils qui ne prennent pas en charge navigator.clipboard
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (successful) {
          console.log('Fallback: Copie réussie avec execCommand');
          setIsCopied({ ...isCopied, [key]: true });
          setTimeout(() => {
            setIsCopied({ ...isCopied, [key]: false });
          }, 2000);
        } else {
          console.error('Fallback: Échec de la copie avec execCommand');
        }
        
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback: Erreur lors de la copie', err);
      }
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log("Copie réussie:", text);
        setIsCopied({ ...isCopied, [key]: true });
        setTimeout(() => {
          setIsCopied({ ...isCopied, [key]: false });
        }, 2000);
      })
      .catch(err => {
        console.error("Erreur lors de la copie dans le presse-papier:", err);
        toast({
          title: "Erreur de copie",
          description: "Impossible de copier le texte dans le presse-papier",
          variant: "destructive",
        });
      });
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log("Début du processus de soumission du paiement");
      setIsProcessing(true);

      // Validation des champs
      if (!phoneNumber) {
        console.error("Erreur: Numéro de téléphone manquant");
        toast({
          title: "Champ requis",
          description: "Veuillez saisir le numéro utilisé pour le paiement",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      if (phoneNumber.length !== 10) {
        console.error("Erreur: Format de numéro de téléphone invalide");
        toast({
          title: "Format invalide",
          description: "Le numéro doit contenir exactement 10 chiffres",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Données avant soumission:", {
        participantId: participant.id,
        paymentMethod,
        phoneNumber,
        comments
      });

      // Enregistrer le paiement manuel dans la base de données
      console.log("Tentative d'enregistrement du paiement dans Supabase");
      const manualPayment = await registerManualPayment(
        participant.id,
        paymentMethod,
        phoneNumber,
        comments
      );

      console.log("Paiement manuel enregistré avec ID:", manualPayment.id);

      // Envoyer une notification à l'administrateur (email défini dans EmailJS)
      console.log("Tentative d'envoi de la notification à l'administrateur");
      await sendAdminNotification(
        manualPayment.id,
        participant,
        paymentMethod,
        phoneNumber,
        comments
      );
      console.log("Notification admin envoyée avec succès");

      // Tenter d'envoyer l'email initial au participant
      console.log("Tentative d'envoi de l'email au participant:", participant.email);
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
        console.log("Email envoyé au participant avec succès");
        // Afficher un message de succès
        toast({
          title: "Paiement soumis avec succès",
          description: "Votre demande est en attente de validation par un administrateur. Vous recevrez un email de confirmation une fois validée.",
          variant: "default",
        });
      }

      // Rediriger vers une page d'attente
      console.log("Préparation de la redirection vers la page d'attente");
      setTimeout(() => {
        console.log("Redirection vers:", `/payment-pending/${participant.id}`);
        navigate(`/payment-pending/${participant.id}`);
      }, 2000);

    } catch (error: any) {
      console.error("Erreur détaillée lors du traitement du paiement manuel:", error);
      let errorMessage = "Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.";
      
      if (error.message) {
        console.error("Message d'erreur:", error.message);
        errorMessage = error.message;
      }
      
      if (error.response) {
        console.error("Réponse d'erreur:", error.response);
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
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
