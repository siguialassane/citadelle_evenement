
// Ce hook gère toute la logique du paiement manuel
// Mise à jour: Correction du problème d'envoi simultané des deux emails

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import emailjs from '@emailjs/browser';
import { 
  PAYMENT_AMOUNT,
  ADMIN_EMAILJS_SERVICE_ID, 
  ADMIN_EMAILJS_TEMPLATE_ID, 
  ADMIN_EMAILJS_PUBLIC_KEY,
  ADMIN_EMAIL,
  EMAILJS_SERVICE_ID, 
  EMAILJS_TEMPLATE_ID, 
  EMAILJS_PUBLIC_KEY
} from "./config";
import { PaymentMethod, Participant, CopyStates } from "./types";

export function useManualPayment(participant: Participant) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [comments, setComments] = useState("");
  const [isCopied, setIsCopied] = useState<CopyStates>({});
  const navigate = useNavigate();

  // Fonction pour générer une référence de transaction unique
  const generateTransactionReference = () => {
    const prefix = "PAY";
    const participantInitials = `${participant.first_name.charAt(0)}${participant.last_name.charAt(0)}`;
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${participantInitials}-${randomDigits}`;
  };

  // Référence de transaction (générée une seule fois)
  const [transactionReference] = useState(generateTransactionReference());

  // Fonction pour copier du texte dans le presse-papier
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied({ ...isCopied, [key]: true });
      setTimeout(() => {
        setIsCopied({ ...isCopied, [key]: false });
      }, 2000);
    });
  };

  // Fonction pour envoyer l'email de notification UNIQUEMENT à l'administrateur
  const sendAdminNotification = async (manualPaymentId: string) => {
    try {
      console.log("Envoi de notification à l'administrateur UNIQUEMENT...");
      
      // URL de base de l'application (important pour générer des liens absolus)
      const appUrl = window.location.origin;
      const validationLink = `${appUrl}/admin/payment-validation/${manualPaymentId}`;
      const currentDate = new Date().toLocaleString('fr-FR');

      // Envoi d'email à l'administrateur
      const templateParams = {
        to_email: ADMIN_EMAIL,
        from_name: "Système d'Inscription IFTAR",
        participant_name: `${participant.first_name} ${participant.last_name}`,
        participant_email: participant.email,
        participant_phone: participant.contact_number,
        payment_amount: `${PAYMENT_AMOUNT} XOF`,
        payment_method: paymentMethod,
        transaction_reference: transactionReference,
        payment_phone: phoneNumber,
        comments: comments || "Aucun commentaire",
        payment_id: manualPaymentId,
        participant_id: participant.id, // Ajout de l'ID du participant pour les liens
        app_url: appUrl,
        current_date: currentDate,
        validation_link: validationLink, // Ajout du lien de validation complet
        // Variables requises par EmailJS
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("Paramètres pour EmailJS (admin):", templateParams);
      console.log("URL de validation admin:", validationLink);
      console.log("URL de la page de paiement en attente:", `${appUrl}/payment-pending/${participant.id}`);

      // N'envoyer QUE l'email à l'administrateur
      const response = await emailjs.send(
        ADMIN_EMAILJS_SERVICE_ID,
        ADMIN_EMAILJS_TEMPLATE_ID,
        templateParams,
        ADMIN_EMAILJS_PUBLIC_KEY
      );

      console.log("Email de notification admin envoyé avec succès:", response);
      
      // Envoyer un email au participant pour lui confirmer que sa demande est en cours de traitement
      // Cette partie est séparée de l'email de confirmation finale avec QR code
      const participantTemplateParams = {
        to_email: participant.email,
        to_name: `${participant.first_name} ${participant.last_name}`,
        from_name: "IFTAR 2024",
        prenom: participant.first_name,
        nom: participant.last_name,
        payment_method: paymentMethod,
        payment_amount: `${PAYMENT_AMOUNT} XOF`,
        payment_phone: phoneNumber,
        app_url: appUrl,
        pending_url: `${appUrl}/payment-pending/${participant.id}`,
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      // Utiliser le service et template pour l'email INITIAL uniquement (et pas celui de confirmation)
      const participantResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID, 
        participantTemplateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Email initial au participant envoyé avec succès:", participantResponse);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email à l'administrateur:", error);
      return false;
    }
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
      console.log("Enregistrement du paiement manuel...");
      const { data: manualPayment, error: paymentError } = await supabase
        .from('manual_payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: paymentMethod,
          phone_number: phoneNumber,
          comments: comments,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Erreur lors de l'enregistrement du paiement:", paymentError);
        throw new Error("Échec de l'enregistrement du paiement. Veuillez réessayer.");
      }

      console.log("Paiement manuel enregistré:", manualPayment);

      // Envoyer une notification à l'administrateur
      const emailSent = await sendAdminNotification(manualPayment.id);
      if (!emailSent) {
        console.warn("L'email de notification n'a pas pu être envoyé à l'administrateur, mais le paiement a été enregistré");
        toast({
          title: "Attention",
          description: "Votre paiement a été soumis mais l'email de notification n'a pas pu être envoyé. Un administrateur sera informé de ce problème.",
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
    transactionReference,
    isCopied,
    copyToClipboard,
    handleSubmit
  };
}
