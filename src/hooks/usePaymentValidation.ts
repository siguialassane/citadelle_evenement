// Hook personnalisé pour gérer la logique de validation des paiements
// Mise à jour: Uniformisation des services EmailJS pour l'envoi des emails
// Correction des problèmes de réception d'email de confirmation avec QR code

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import emailjs from '@emailjs/browser';
import { 
  EMAILJS_SERVICE_ID,
  EMAILJS_PUBLIC_KEY,
  CONFIRMATION_TEMPLATE_ID
} from "@/components/manual-payment/config";
import { Payment } from "@/types/payment";

export const usePaymentValidation = (paymentId?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    document.title = paymentId
      ? `Valider le paiement | IFTAR 2024`
      : "Validation des paiements | IFTAR 2024";

    if (paymentId) {
      fetchPaymentById(paymentId);
    } else {
      fetchPendingPayments();
    }
  }, [paymentId]);

  const fetchPendingPayments = async () => {
    try {
      setIsLoading(true);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participants(*)
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        toast({
          title: "Aucun paiement trouvé",
          description: "Il n'y a aucun paiement dans le système pour le moment.",
        });
        setPayments([]);
        setFilteredPayments([]);
        setTotalPayments(0);
        return;
      }

      const formattedPayments = paymentsData.map(payment => {
        const date = new Date(payment.created_at);
        const formattedDate = date.toLocaleDateString('fr-FR');
        const formattedTime = date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });

        return {
          id: payment.id,
          participant_id: payment.participant_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          phone_number: payment.phone_number,
          status: payment.status,
          comments: payment.comments,
          created_at: payment.created_at,
          formatted_date: formattedDate,
          formatted_time: formattedTime,
          participant_name: `${payment.participants.first_name} ${payment.participants.last_name}`,
          participant_email: payment.participants.email,
          participant_phone: payment.participants.contact_number,
          participant: payment.participants
        };
      });

      const pendingPayments = formattedPayments.filter(p => p.status === 'pending');
      setTotalPayments(pendingPayments.length);
      
      setPayments(formattedPayments);
      setFilteredPayments(formattedPayments);

    } catch (error: any) {
      console.error("Erreur lors de la récupération des paiements:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentById = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participants(*)
        `)
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;

      if (!paymentData) {
        setError("Paiement non trouvé");
        return;
      }

      const date = new Date(paymentData.created_at);
      const formattedDate = date.toLocaleDateString('fr-FR');
      const formattedTime = date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      const formattedPayment = {
        id: paymentData.id,
        participant_id: paymentData.participant_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        phone_number: paymentData.phone_number,
        status: paymentData.status,
        comments: paymentData.comments,
        created_at: paymentData.created_at,
        formatted_date: formattedDate,
        formatted_time: formattedTime,
        participant_name: `${paymentData.participants.first_name} ${paymentData.participants.last_name}`,
        participant_email: paymentData.participants.email,
        participant_phone: paymentData.participants.contact_number,
        participant: paymentData.participants
      };

      setCurrentPayment(formattedPayment);
      setFilteredPayments([formattedPayment]);

    } catch (error: any) {
      console.error("Erreur lors de la récupération du paiement:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    filterPayments(e.target.value);
  };

  const filterPayments = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = payments.filter(payment =>
      payment.participant_name.toLowerCase().includes(lowerCaseQuery) ||
      payment.participant_email.toLowerCase().includes(lowerCaseQuery) ||
      payment.phone_number.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredPayments(filtered);
  };

  const validatePayment = async (paymentId: string) => {
    try {
      setIsValidating(true);
      console.log("==== DÉBUT DU PROCESSUS DE VALIDATION DE PAIEMENT ====");
      console.log(`Validation du paiement ID: ${paymentId}`);
      
      // Mettre à jour le statut du paiement à "completed"
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({ 
          status: 'completed',
          validated_at: new Date().toISOString(),
          validated_by: "Admin" // Idéalement, remplacer par l'ID ou le nom de l'admin connecté
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut du paiement:", updateError);
        throw updateError;
      }
      
      console.log("Statut du paiement mis à jour avec succès dans la base de données");

      // Récupérer les informations du paiement
      const paymentToValidate = currentPayment || payments.find(p => p.id === paymentId);
      
      if (!paymentToValidate) {
        console.error("Données de paiement introuvables pour l'ID:", paymentId);
        throw new Error("Données de paiement manquantes");
      }
      
      console.log("Informations de paiement récupérées avec succès:", {
        participant_id: paymentToValidate.participant_id,
        participant_name: paymentToValidate.participant_name,
        participant_email: paymentToValidate.participant_email
      });

      // Génération d'un UUID pour le QR code
      const qrCodeId = uuidv4();
      console.log("Génération d'un nouveau QR code ID:", qrCodeId);

      // Mettre à jour le statut du participant et associer le QR code
      console.log("Mise à jour du statut du participant et enregistrement du QR code...");
      const { error: participantError } = await supabase
        .from('participants')
        .update({ 
          payment_status: 'completed',
          qr_code_id: qrCodeId
        })
        .eq('id', paymentToValidate.participant_id);

      if (participantError) {
        console.error("Erreur lors de la mise à jour des données du participant:", participantError);
        throw participantError;
      }
      
      console.log("Statut du participant mis à jour avec succès, QR code associé");

      // Récupérer les données complètes du participant
      const { data: participantData, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', paymentToValidate.participant_id)
        .single();

      if (fetchError) {
        console.error("Erreur lors de la récupération des données du participant:", fetchError);
        throw fetchError;
      }
      
      if (!participantData) {
        console.error("Aucune donnée de participant trouvée pour l'ID:", paymentToValidate.participant_id);
        throw new Error("Participant non trouvé");
      }
      
      console.log("Données complètes du participant récupérées:", {
        id: participantData.id,
        email: participantData.email,
        first_name: participantData.first_name,
        last_name: participantData.last_name,
        qr_code_id: participantData.qr_code_id
      });

      // Vérification que l'email existe et est correctement formaté
      if (!participantData.email || !participantData.email.includes('@')) {
        console.error("Email du participant invalide ou manquant:", participantData.email);
        throw new Error("Email du participant invalide");
      }

      // Envoi de l'email de confirmation APRÈS avoir tout validé et mis à jour en base
      console.log("=== PRÉPARATION DE L'ENVOI D'EMAIL DE CONFIRMATION ===");
      
      try {
        console.log("Lancement de l'envoi d'email de confirmation...");
        
        // Vérification des configurations d'envoi d'email
        console.log("Configuration d'envoi d'email de confirmation (UNIFORMISÉE):");
        console.log("- Service EmailJS:", EMAILJS_SERVICE_ID);
        console.log("- Template ID:", CONFIRMATION_TEMPLATE_ID);
        console.log("- Clé publique:", EMAILJS_PUBLIC_KEY);
        
        // Envoi de l'email de confirmation avec QR code
        const emailSuccess = await sendConfirmationEmail(participantData, qrCodeId);
        
        if (emailSuccess) {
          console.log("✅ Email de confirmation envoyé avec succès");
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
        description: `Un email de confirmation a été envoyé à ${paymentToValidate.participant_email}`,
        variant: "default",
      });

      // Mise à jour locale des données
      const updatedPayments = payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'completed' } 
          : payment
      );
      
      setPayments(updatedPayments);
      filterPayments(searchQuery);
      
      console.log("==== FIN DU PROCESSUS DE VALIDATION DE PAIEMENT ====");
      return true;

    } catch (error: any) {
      console.error("Erreur lors de la validation du paiement:", error);
      console.error("Message d'erreur complet:", error.message);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation du paiement",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setIsRejecting(true);

      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      toast({
        title: "Paiement rejeté avec succès",
        description: "Le paiement a été rejeté et le participant sera notifié.",
        variant: "default",
      });

      const updatedPayments = payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'rejected' } 
          : payment
      );
      
      setPayments(updatedPayments);
      filterPayments(searchQuery);

      return true;

    } catch (error: any) {
      console.error("Erreur lors du rejet du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du rejet du paiement",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRejecting(false);
    }
  };

  const sendConfirmationEmail = async (participantData: any, qrCodeId: string) => {
    try {
      console.log("===== ENVOI EMAIL DE CONFIRMATION AVEC QR CODE =====");
      
      // Validation des données du participant
      if (!participantData || !participantData.email) {
        console.error("Données du participant manquantes ou invalides:", participantData);
        return false;
      }
      
      // Nettoyage et validation de l'email
      const emailAddress = participantData.email.trim();
      if (!emailAddress || !emailAddress.includes('@')) {
        console.error("Adresse email invalide:", emailAddress);
        return false;
      }
      
      console.log("Email du destinataire:", emailAddress);
      
      // Récupération de l'URL de base de l'application
      const appUrl = window.location.origin;
      console.log("URL de base de l'application:", appUrl);
      
      // Détermination du statut pour l'affichage
      const statut = participantData.is_member ? "Membre" : "Non-membre";
      console.log("Statut du participant:", statut);
      
      // Construction de l'URL de confirmation avec l'ID du participant
      const confirmationUrl = `${appUrl}/confirmation/${participantData.id}`;
      console.log("URL de confirmation générée:", confirmationUrl);
      
      // Construction de l'URL du QR code avec l'URL complète comme données
      const qrCodeData = `${appUrl}/confirmation/${participantData.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
      console.log("URL du QR code générée:", qrCodeUrl);
      console.log("Données encodées dans le QR code:", qrCodeData);
      
      // Préparation des paramètres pour le template de confirmation avec QR code
      const templateParams = {
        to_email: emailAddress,
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        from_name: "IFTAR 2024",
        prenom: participantData.first_name.trim(),
        nom: participantData.last_name.trim(),
        tel: participantData.contact_number,
        status: statut,
        qr_code_url: qrCodeUrl,
        participant_id: participantData.id,
        app_url: appUrl,
        receipt_url: `${appUrl}/confirmation/${participantData.id}`,
        badge_url: `${appUrl}/confirmation/${participantData.id}`,
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("Paramètres préparés pour le template d'email:", templateParams);
      console.log("Tentative d'envoi de l'email avec EmailJS (NOUVEAU SERVICE UNIFIÉ)...");

      // Utilisation du MÊME service et des MÊMES identifiants que pour les emails initiaux
      // Mais avec le template de confirmation qui contient le QR code
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        CONFIRMATION_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Réponse EmailJS:", response);
      console.log("Email de confirmation avec QR code envoyé avec succès");
      return true;
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
      console.error("Message d'erreur spécifique:", error.message);
      
      // Log plus détaillé pour aider au débogage
      if (error.status) {
        console.error("Status de l'erreur:", error.status);
      }
      if (error.text) {
        console.error("Texte de l'erreur:", error.text);
      }
      
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchPendingPayments();
    toast({
      title: "Liste actualisée",
      description: "La liste des paiements a été actualisée",
    });
  };

  return {
    payments,
    filteredPayments,
    currentPayment,
    searchQuery,
    isLoading,
    isSubmitting,
    isRejecting,
    isValidating,
    error,
    totalPayments,
    handleSearch,
    validatePayment,
    rejectPayment,
    handleRefresh,
    setCurrentPayment,
  };
};
